/** Admin area shell: applies the admin font (Inter_Tight) + larger type scale
 * to everything under /admin, including the login page. */
export default function AdminAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="admin-scope font-admin">{children}</div>;
}
