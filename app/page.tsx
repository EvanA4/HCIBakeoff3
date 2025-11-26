import ProtoList from "@/components/protoList";
import { readdirSync } from "fs";

function Home() {
  const ignored = [
    'favicon.ico',
    'globals.css',
    'layout.tsx',
    'page.tsx'
  ];
  const protoRoutes = readdirSync("./app").filter(name => !ignored.includes(name))
    .sort((a, b) => {
      if (a === "original")
        return 1;
      else if (b === "original")
        return -1;
      // console.log(a, b, parseInt(a.substring(5)), parseInt(b.substring(5)))
      return parseInt(a.substring(5)) > parseInt(b.substring(5)) ? -1 : 1;
    });

  return <ProtoList routes={protoRoutes} />;
}

export default Home;
