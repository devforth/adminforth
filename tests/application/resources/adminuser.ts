import usersResource from "../../../dev-demo/resources/adminuser.js";

export default {
  ...usersResource,
  columns: usersResource.columns.map((column) => column.name === 'email'
    ? { ...column, normalize: (value: string) => value.trim().toLowerCase() }
    : column),
  plugins: [
    ...usersResource.plugins?.filter((p) => ![
      'AdminForthAgentPlugin',
      'TwoFactorsAuthPlugin',
      'DashboardPlugin',
    ].includes(p.className)) || [],
  ],
}
