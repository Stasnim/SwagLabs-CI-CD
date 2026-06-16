export type UserRole =
  | "standard_user"
  | "locked_out_user"
  | "problem_user"
  | "performance_glitch_user";

export interface User {
  username: UserRole;
  password: string;
}

export interface Product {
  name: string;
  price: number;
}

export interface CheckoutInfo {
  firstName: string;
  lastName:  string;
  postalCode: string;
}

export type SortOption = "az" | "za" | "lohi" | "hilo";
