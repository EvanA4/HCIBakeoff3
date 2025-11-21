import ProtoList from "@/components/protoList";
import { readdirSync } from "fs";

function Home() {
  const ignored = [
    'favicon.ico',
    'globals.css',
    'layout.tsx',
    'page.tsx'
  ];
  const protoRoutes = readdirSync("./app").filter(name => !ignored.includes(name));

  return <ProtoList routes={protoRoutes} />;
}

export default Home;
