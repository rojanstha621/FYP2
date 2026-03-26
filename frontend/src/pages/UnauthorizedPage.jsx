import { useNavigate } from 'react-router-dom';

export const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-4 py-10">
      <div className="w-full rounded-xl border border-red-200 bg-red-50 p-8 text-center shadow-sm">
        <h1 className="mb-3 text-3xl font-bold text-red-700">Unauthorized</h1>
        <p className="mb-6 text-red-800">You do not have permission to view this page</p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Back
        </button>
      </div>
    </div>
  );
};
