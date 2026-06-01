export function SignOutButton() {
  return (
    <form action="/auth/signout" method="POST">
      <button className="sidebar-sign-out-btn" type="submit">
        Sign out
      </button>
    </form>
  );
}
