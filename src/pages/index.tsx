import { Countdown } from "@/countdown/Countdown"
import Head from "next/head"


export default function Home() {
  return (
    <>
      <Head>
        <title>FPOP Countdown</title>
        <meta name="description" content="tick tock, nerds :catstab:" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <Countdown event_name="FPOP" until={new Date(1724169600000)} />
      </main>
    </>
  );
}
