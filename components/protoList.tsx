"use client"

import { useState } from "react"

export default function ProtoList(props: {
    routes: string[]
}) {
    const [dpi, setDpi] = useState(0);

    return (
        <div className="h-full w-full">
            <div className="sticky top-0 right-0 z-10 bg-blue-600 p-3 shadow-2xl">
                <div className="flex w-full justify-between items-center">
                    <p className="text-white text-2xl">Prototypes</p>
                    <div className="flex gap-3">
                        <span className="text-neutral-300">DPI: </span>
                        <div className="rounded-md overflow-hidden">
                            <input
                                type="number"
                                placeholder="dpi"
                                className="focus:bg-blue-400 px-3 text-white h-full outline-none border-b-2 border-blue-300 w-[60px]"
                                value={dpi}
                                onChange={(e) => {
                                    setDpi(() => {
                                        try {
                                            return parseInt(e.target.value === "" ? "0" : e.target.value)
                                        } catch {
                                            return 0;
                                        }
                                    });
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col overflow-scroll text-center">
                {
                    props.routes.map((name, idx) => {
                        return (
                            dpi === 0 ?
                            <p
                                key={idx} className="bg-white hover:bg-neutral-100 p-3 border-b-2 border-neutral-200"
                            >
                                {name}
                            </p> : 
                            <a key={idx} href={`${name}?dpi=${dpi}`}>
                                <p
                                    className="bg-white hover:bg-neutral-100 p-3 border-b-2 border-neutral-200"
                                >
                                    {name}
                                </p>
                            </a>
                        );
                    })
                }
            </div>
        </div>
    )
}
