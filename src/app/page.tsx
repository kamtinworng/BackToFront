import { redirect } from "next/navigation";
function Home() {
  return redirect(`/game`);
}
export default Home;
