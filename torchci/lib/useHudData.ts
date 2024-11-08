import { useCHContext } from "components/UseClickhouseProvider";
import useSWR from "swr";
import {
  CondensedRowData,
  formatHudUrlForFetch,
  HudParams,
  JobData,
  RowData,
} from "./types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function useHudData(params: HudParams): RowData[] | undefined {
  const { useCH } = useCHContext();
  const { data } = useSWR(
    formatHudUrlForFetch("api/hud", { ...params, use_ch: useCH }),
    fetcher,
    {
      refreshInterval: 60 * 1000, // refresh every minute
      // Refresh even when the user isn't looking, so that switching to the tab
      // will always have fresh info.
      refreshWhenHidden: true,
    }
  );

  // Add job name info back into the data (it was stripped out as technically it's redundant)
  if (data === undefined) {
    return data;
  }

  data.shaGrid.forEach((row: CondensedRowData) => {
    row.jobs.forEach((job: JobData, index: number) => {
      job.name = data.jobNames[index];
    });
  });

  const newShaGrid = data.shaGrid.map((row: CondensedRowData) => {
    let unCondensedRow: RowData = {
      ...row,
      nameToJobs: new Map<string, JobData>(),
    };
    unCondensedRow.nameToJobs =
      row.jobs.reduce((map, obj) => (map.set(obj.name, obj), map), new Map()) ??
      new Map();
    // @ts-ignore - jobs is not in RowData
    delete unCondensedRow.jobs;
    return unCondensedRow;
  });
  return newShaGrid;
}
