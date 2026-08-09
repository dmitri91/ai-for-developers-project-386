import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

const asUtc = (value: string | null | undefined) => (value ? dayjs(value).utc() : dayjs(undefined).utc());

export const formatTime = (iso: string | null | undefined) => asUtc(iso).format("HH:mm");
export const formatDateLabel = (iso: string | null | undefined) => asUtc(iso).format("dddd, D MMMM");
export const formatDateShort = (iso: string | null | undefined) => asUtc(iso).format("ddd, D MMM");
export const formatDayQuery = (iso: string | null | undefined) => asUtc(iso).format("YYYY-MM-DD");