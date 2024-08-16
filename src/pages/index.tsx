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
        <Countdown event_name="FPOP" until={new Date("2024-08-20 11:31:00 EDT")} />
        {/* <Countdown event_name="FPOP" until={new Date("2024-08-20 12:00:00 EDT")} /> */}
      </main>
    </>
  );
}
