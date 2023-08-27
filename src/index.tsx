import { List, Action, ActionPanel } from "@raycast/api";
import { useEffect, useState } from "react";
import moment from "moment-timezone";
import { delay, addFavorite, removeFavorite } from "./utils";

interface Data {
  name: string;
  title: string;
  dateStr: string;
  favorite?: boolean;
}

/**
 * Generates the time zone selector component.
 *
 * @param {Object} props - The properties of the component.
 * @param {Function} props.onTZChange - The callback function to be called when the time zone is changed.
 * @return {JSX.Element} The JSX element representing the time zone selector.
 */
function TZS(props: { onTZChange: (newValue: string) => void }): JSX.Element {
  const tzs = moment.tz.names();
  // console.log(tzs);

  const { onTZChange } = props;
  return (
    <List.Dropdown
      tooltip="Select TZ"
      storeValue={true}
      onChange={(newValue) => {
        onTZChange(newValue);
      }}
    >
      <List.Dropdown.Section title="Time Zone List">
        {tzs.map((tz) => (
          <List.Dropdown.Item key={tz} title={tz} value={tz} />
        ))}
      </List.Dropdown.Section>
    </List.Dropdown>
  );
}

// 是不是时间格式
function isDateTimeString(dateString: string): boolean {
  return moment(dateString, moment.ISO_8601, true).isValid();
}

// 两个时区的转换
function convertDatesBetweenTimezones(date: string, fromZone: string, toZone: string) {
  if (!date) {
    date = moment().format("YYYY-MM-DD HH:mm:ss");
  }
  const from = moment.tz(date, fromZone);
  return from.clone().tz(toZone);
}

// 时区名称
function getTitle(date: string, fromZone: string, toZone: string): string {
  const toZoneDate = convertDatesBetweenTimezones(date, fromZone, toZone).format("YYYY-MM-DD HH:mm:ss");
  return `${toZone}(${moment.tz(fromZone).format("ZZ")}): ${toZoneDate}`;
}

// 获取所有时区的转换后的时间
function getAllTimeZones(date: string, fromZone: string): Array<Data> {
  const timeZones = moment.tz.names().map((tz) => {
    const title = getTitle(date, fromZone, tz);
    const dateStr = convertDatesBetweenTimezones(date, fromZone, tz).format("YYYY-MM-DD HH:mm:ss");
    return { name: tz, title: title, dateStr: dateStr, favorite: false };
  });
  return timeZones;
}

export default function Command() {
  let changeNumber = 0;
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [timeZoneSpecified, setTimeZoneSpecified] = useState<string>("");
  const [timeSpecified, setTimeSpecified] = useState<string>("");
  const [allTZ, setAllTZ] = useState<Array<Data>>([]);
  if (!getAllTimeZones) {
    setTimeSpecified(moment().format("YYYY-MM-DD HH:mm:ss"));
  }

  useEffect(() => {
    // 以当地时间为初始时间，初始化列表
    setIsLoading(true);
    setAllTZ(getAllTimeZones(timeSpecified, timeZoneSpecified));
    setIsLoading(false);
  }, []);

  // 默认时区发生变化时，修改列表的值
  function onTZChange(newValue: string) {
    setTimeZoneSpecified(newValue);
    setAllTZ(getAllTimeZones(timeSpecified, timeZoneSpecified));
  }

  function getActions(item: Data) {
    const actions = [
      <Action.CopyToClipboard title="Copy Price" content={item.dateStr} onCopy={() => item.dateStr} />,
      <Action
        title={item.favorite ? "Remove From Favorite" : "Add To Favorite"}
        icon={item.favorite ? "remove.png" : "favorite.png"}
        onAction={async () => {
          setAllTZ((allTZ) =>
            allTZ.map((i) => {
              if (i.name === item.name) {
                return { ...i, favorite: !item.favorite };
              }
              return i;
            })
          );
          if (item.favorite) {
            await removeFavorite(item.name);
          } else {
            addFavorite(item.name);
          }
        }}
      />,
    ];
    return <ActionPanel>{...actions}</ActionPanel>;
  }

  return (
    <List
      isLoading={isLoading}
      filtering={true}
      searchBarPlaceholder="Get other time zone times for input time."
      searchBarAccessory={<TZS onTZChange={onTZChange} />}
      onSearchTextChange={(searchText) => {
        // 实现延迟搜索
        changeNumber += 1;
        const currentChangeNumber = changeNumber;
        delay(800).then(() => {
          // 过滤非正常搜索 + 延迟搜索
          if (searchText === "" || currentChangeNumber !== changeNumber) {
            return;
          } else {
            // 检查输入的是否是日期格式
            if (isDateTimeString(searchText)) {
              setTimeSpecified(searchText);
              setIsLoading(true);
              const timeZones = getAllTimeZones(timeSpecified, timeZoneSpecified);
              setAllTZ(timeZones);
              setIsLoading(false);
            }
          }
        });
      }}
    >
      {allTZ.map((item: Data) => (
        <List.Item
          key={item.name}
          title={item.title}
          actions={getActions(item)}
          accessories={item.favorite ? [{ icon: "favorited.png", tooltip: "Favorited" }] : []}
        />
      ))}
    </List>
  );
}
