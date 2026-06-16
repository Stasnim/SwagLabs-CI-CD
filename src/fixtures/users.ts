import type { User, UserRole } from "../types";

const PASSWORD = process.env.USER_PASSWORD ?? "secret_sauce";

export const USERS: Record<UserRole, User> = {
  standard_user:           { username: "standard_user",           password: PASSWORD },
  locked_out_user:         { username: "locked_out_user",         password: PASSWORD },
  problem_user:            { username: "problem_user",            password: PASSWORD },
  performance_glitch_user: { username: "performance_glitch_user", password: PASSWORD },
};
