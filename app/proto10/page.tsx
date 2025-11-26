"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";

function Proto10Page() {
  const Proto10 = useMemo(
    () =>
      dynamic(() => import("@/components/prototypes/proto10"), {
        loading: () => (
          <></>
        ),
        ssr: false,
      }),
    [],
  );

  const searchParams = useSearchParams()
  let dpi = 0;
  try {
    const dpiStr = searchParams.get('dpi');
    if (dpiStr === null) {
      throw new Error("Invalid DPI in search parameters!");
    }
    dpi = parseInt(dpiStr);
  } catch {
    return <Link href="/" className="p-3 bg-neutral-200 hover:bg-neutral-300 active:bg-neutral-300 rounded-2xl">Invalid DPI. Click here to return to home.</Link>;
  }

  return (<Proto10 dpi={dpi}/>);
}

function Proto10Sus() {
  return <Suspense>
    <Proto10Page />
  </Suspense>
}

export default Proto10Sus;
