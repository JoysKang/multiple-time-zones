import { List, Toast, showToast } from "@raycast/api";
import { useState } from "react";
import moment from "moment-timezone";
import { delay } from "./utils";

interface Data {
  name: string;
  timeStr: string;
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

function isDateTimeString(dateString: string): boolean {
  return moment(dateString, moment.ISO_8601, true).isValid();
}

function convertDatesBetweenTimezones(date: string, fromZone: string, toZone: string) {
  const from = moment.tz(date, fromZone);
  return from.clone().tz(toZone);
}

/**
 * Retrieves the title for a given date and time in a specified time zone.
 *
 * @param {string} date - The date and time to retrieve the title for. If not provided, the current date and time will be used.
 * @param {string} fromZone - The time zone of the input date and time.
 * @param {string} toZone - The time zone to convert the date and time to.
 * @return {string} The title for the converted date and time in the specified time zone.
 */
function getTitle(date: string, fromZone: string, toZone: string): string {
  if (!date) {
    date = moment().format("YYYY-MM-DD HH:mm:ss");
  }
  const toZoneDate = convertDatesBetweenTimezones(date, fromZone, toZone).format("YYYY-MM-DD HH:mm:ss");
  // if (toZone === "Asia/Shanghai") {
  //   console.log(fromZone, toZone, "===", toZoneDate);
  // }

  return `${toZone}(${moment.tz(fromZone).format("ZZ")}): ${toZoneDate}`;
}

export default function Command() {
  let changeNumber = 0;
  const [timeZoneSpecified, setTimeZoneSpecified] = useState<string>("");
  const [timeSpecified, setTimeSpecified] = useState<string>("");
  const onTZChange = (newValue: string) => {
    console.log(newValue, "===");
    setTimeZoneSpecified(newValue);
  };

  return (
    <List
      filtering={false}
      searchBarPlaceholder="Get other time zone times for input time."
      searchBarAccessory={<TZS onTZChange={onTZChange} />}
      onSearchTextChange={(searchText) => {
        // 实现延迟搜索
        changeNumber += 1;
        const currentChangeNumber = changeNumber;
        delay(1200).then(() => {
          // 过滤非正常搜索 + 延迟搜索
          if (searchText === "" || currentChangeNumber !== changeNumber) {
            return;
          } else {
            // 检查输入的是否是日期格式
            if (!isDateTimeString(searchText)) {
              showToast({
                title: "Format error.",
                message: "The input is not in time format.",
                style: Toast.Style.Failure,
              });
            } else {
              setTimeSpecified(searchText);
            }
          }
        });
      }}
    >
      {moment.tz.names().map((tz) => (
        <List.Item key={tz} title={getTitle(timeSpecified, timeZoneSpecified, tz)} />
      ))}
    </List>
  );
}
