import usersResource from "../../../dev-demo/resources/adminuser.js";

export default {
  ...usersResource,
  plugins: [
    ...usersResource.plugins?.filter((p) => ![
      'AdminForthAgentPlugin',
      'TwoFactorsAuthPlugin',
    ].includes(p.className)) || [],
  ],
}