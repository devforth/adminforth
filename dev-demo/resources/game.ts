import { AdminForthDataTypes, AdminForthResourceInput } from "../../adminforth";

export default {
  dataSource: "db3",
  table: "game",
  columns: [
    {
      name: "_id",
      primaryKey: true,
      type: AdminForthDataTypes.STRING,
      maxLength: 255,
      required: true,
    },
    {
      name: "bb_enabled",
      type: AdminForthDataTypes.BOOLEAN,
      required: false,
    },
    {
      name: "email",
      type: AdminForthDataTypes.STRING,
      required: false,
    },
    { name: "bb_rank", type: AdminForthDataTypes.INTEGER, required: false },
    {
      name: "blocked_countries",
      type: AdminForthDataTypes.STRING,
      maxLength: 255,
      required: false,
      enum: [
        { value: "TR", label: "Turkey" },
        { value: "DE", label: "Germany" },
        { value: "RU", label: "Russia" },
        { value: "US", label: "United States" },
        { value: "GB", label: "United Kingdom" },
        { value: "FR", label: "France" },
        { value: "IT", label: "Italy" },
        { value: "ES", label: "Spain" },
        { value: "BR", label: "Brazil" },
        { value: "CA", label: "Canada" },
        { value: "AU", label: "Australia" },
        { value: "NL", label: "Netherlands" },
        { value: "SE", label: "Sweden" },
        { value: "NO", label: "Norway" },
        { value: "FI", label: "Finland" },
        { value: "DK", label: "Denmark" },
        { value: "PL", label: "Poland" },
        { value: "CZ", label: "Czechia" },
        { value: "SK", label: "Slovakia" },
        { value: "HU", label: "Hungary" },
        { value: "RO", label: "Romania" },
        { value: "BG", label: "Bulgaria" },
        { value: "GR", label: "Greece" },
        { value: "TR", label: "Turkey" },
      ],
    },
    {
      name: "release_date",
      type: AdminForthDataTypes.DATETIME,
      required: false,
    },
  ],
} as AdminForthResourceInput;
