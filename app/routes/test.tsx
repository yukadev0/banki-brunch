import { useCallback, useEffect, useState } from "react";
import { useFetcher } from "react-router";
import type { Route } from "./+types/test";

export async function loader({ context }: Route.LoaderArgs) {
  const stub = context.do.getByName("/live");
  const value = await stub.getValue();

  return { value };
}

export async function action({ context }: Route.ActionArgs) {
  const stub = context.do.getByName("/live");
  const value = await stub.increaseValue();

  return { value };
}

export default function TestPage({ loaderData }: Route.ComponentProps) {
  const fetcher = useFetcher();
  const [value, setValue] = useState(loaderData.value);

  useEffect(() => {
    if (fetcher.data) {
      setValue(fetcher.data.value);
    }
  }, [fetcher.state]);

  const increaseCount = useCallback(async () => {
    await fetcher.submit(null, { method: "post" });
  }, []);

  return (
    <div className="min-h-screen text-gray-100 flex flex-col items-center justify-center gap-8 py-12">
      <h1 className="text-4xl font-semibold text-center text-white">{value}</h1>

      <button
        type="submit"
        onClick={increaseCount}
        className="bg-red-500 text-white hover:bg-red-600 px-4 py-2 rounded-lg transition transform shadow-md"
      >
        Increase Count
      </button>
    </div>
  );
}
