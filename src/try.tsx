import { Action, ActionPanel, Color, getPreferenceValues, Icon, List, showToast, Toast } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import slugify from "@sindresorhus/slugify";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { startTransition, useMemo, useState } from "react";
import { useTodayDate } from "./hooks/date.js";

const PROJECT_DIR_NAME_REGEX = /^(\d{4}-\d{2}-\d{2})-(.+)$/;

const dirFetcher = async (root: string) =>
  (await fs.readdir(root, { withFileTypes: true }))
    .filter((item) => item.isDirectory())
    .map(({ name }) => ({ name, fullPath: path.join(root, name) }));

export default function Command() {
  const { try_dir, open_app } = getPreferenceValues<Preferences>();

  const todayDate = useTodayDate();
  const { data, isLoading, revalidate } = useCachedPromise(dirFetcher, [try_dir]);

  const [searchText, setSearchText] = useState("");
  const slugifiedSearchText = useMemo(() => slugify(searchText), [searchText]);

  const dirItems = useMemo(
    () =>
      data
        ?.map(({ name, fullPath }) => {
          const match = name.match(PROJECT_DIR_NAME_REGEX);
          if (match) {
            const [, dateString, baseName] = match;
            const date = new Date(dateString);
            return { fullName: name, name: baseName, date, fullPath };
          } else {
            return { fullName: name, name, date: null, fullPath };
          }
        })
        .sort((a, b) => (a.date && b.date ? b.date.getTime() - a.date.getTime() : 0)) // Sort newest first, nulls last
        .map((item) => (
          <List.Item
            key={item.fullPath}
            id={`select:${item.fullPath}`}
            title={item.name}
            accessories={[{ date: item.date, icon: Icon.Calendar }]}
            keywords={item.name.split(/[\s-_]+/)}
            actions={
              <ActionPanel>
                {open_app ? (
                  <Action.Open
                    target={item.fullPath}
                    title={`Open in ${open_app.localizedName ?? open_app.name}`}
                    icon={{ fileIcon: open_app.path }}
                    application={open_app}
                  />
                ) : null}
                <Action.Open target={item.fullPath} title="Open Folder" icon={Icon.Folder} />
                <Action.OpenWith path={item.fullPath} />
                <Action.ShowInFinder path={item.fullPath} />
                <Action.Trash paths={[item.fullPath]} onTrash={revalidate} />
              </ActionPanel>
            }
            icon={{ source: Icon.Folder }}
          />
        )),
    [data, open_app, revalidate],
  );

  const newDirName = useMemo(
    () => `${todayDate.toISOString().split("T")[0]}-${slugifiedSearchText}`,
    [slugifiedSearchText, todayDate],
  );

  return (
    <List isLoading={isLoading} searchText={searchText} onSearchTextChange={setSearchText} filtering>
      {searchText ? (
        <List.Item
          id="create"
          title={slugifiedSearchText}
          subtitle={newDirName}
          keywords={[searchText]}
          icon={{
            source: Icon.NewFolder,
            tintColor: Color.Green,
          }}
          actions={
            <ActionPanel>
              <Action
                title="Create"
                icon={Icon.Plus}
                onAction={() =>
                  startTransition(async () => {
                    const [toast] = await Promise.all([
                      showToast({ style: Toast.Style.Animated, title: "Creating folder..." }),
                      fs.mkdir(path.join(try_dir, newDirName)),
                    ]);

                    Object.assign(toast, {
                      style: Toast.Style.Success,
                      title: "Folder created",
                      message: newDirName,
                    });

                    revalidate();
                  })
                }
              />
            </ActionPanel>
          }
        />
      ) : null}
      {dirItems}
    </List>
  );
}
