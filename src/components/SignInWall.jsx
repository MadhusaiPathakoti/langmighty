import LmLogo from "./LmLogo.jsx";

// Blocks access to every feature view for a signed-out visitor. Rendered in
// place of the view itself (see App.jsx) rather than as an unclosable modal,
// so the requirement is enforced without trapping the visitor in a popup.
export default function SignInWall({ onSignIn, onSignUp }) {
  return (
    <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-10">
      <div className="max-w-sm w-full text-center">
        <LmLogo className="w-16 h-16 mx-auto mb-5" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Sign in to continue</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Create a free account or sign in to use LangMighty's translator, AI chat, and learning tools.
        </p>
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onSignUp}
            className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 text-sm transition-colors"
          >
            Create a free account
          </button>
          <button
            type="button"
            onClick={onSignIn}
            className="rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-medium px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
