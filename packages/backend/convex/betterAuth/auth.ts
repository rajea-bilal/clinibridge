import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";

const statement = {
  organization: ["create", "read", "update", "delete"],
  member: ["invite", "remove", "read", "update"],
} as const;

const ac = createAccessControl(statement);

const owner = ac.newRole({
  organization: ["create", "read", "update", "delete"],
  member: ["invite", "remove", "read", "update"],
});

const admin = ac.newRole({
  organization: ["read", "update"],
  member: ["invite", "remove", "read", "update"],
});

const member = ac.newRole({
  organization: ["read"],
  member: ["read"],
});

export const auth = betterAuth({
  database: {} as never,
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    organization({
      ac,
      allowUserToCreateOrganization: true,
      organizationLimit: 10,
      roles: {
        owner,
        admin,
        member,
      },
    }),
  ],
});
