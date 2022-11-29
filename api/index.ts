import { IncomingMessage, ServerResponse } from "http";
import { getScreenshot } from "./_lib/chromium";
import axios from "axios";
import { getEventHtml, getHtml } from "./_lib/template";

const isDev = !process.env.AWS_REGION;
const isHtmlDebug = process.env.OG_HTML_DEBUG === "1";

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
) {
  try {
    const fileType = "png";
    console.log("testing???");

    const url = new URL(req.url ?? "", "http://localhost"); // TODO
    const label = url.searchParams.get("label");
    const leagueId = url.searchParams.get("league")?.toString();
    const eventId = url.searchParams.get("event")?.toString();

    console.log("params", req.url, leagueId, eventId);

    if (!eventId || !leagueId) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "text/html");
      res.end("<h1>Not found</h1>");
      return;
    }

    const headers = {
      "x-api-key": process.env.OUTLIER_API_KEY!,
    };

    console.log(
      `${
        process.env.OUTLIER_API_BASE_URL
      }/sportsdata/leagues/${leagueId.toUpperCase()}/schedule`,
      { headers }
    );

    const [schedule, metadata] = await Promise.all([
      axios
        .get(
          `${
            process.env.OUTLIER_API_BASE_URL
          }/sportsdata/leagues/${leagueId.toUpperCase()}/schedule`,
          { headers }
        )
        .then((res) => res.data),
      axios
        .get(`${process.env.OUTLIER_API_BASE_URL}/sportsdata/teamMetadata`, {
          headers,
        })
        .then((res) => res.data),
    ]);

    const event = schedule.events.find((e) => e.eventId === eventId);
    const home =
      metadata.content.leagues[leagueId.toUpperCase()].teams[event.home.teamId];
    const away =
      metadata.content.leagues[leagueId.toUpperCase()].teams[event.away.teamId];

    const html = await getEventHtml();
    const file = await getScreenshot(html, fileType, isDev);

    res.statusCode = 200;
    res.setHeader("Content-Type", `image/${fileType}`);
    res.setHeader(
      "Cache-Control",
      `public, immutable, no-transform, s-maxage=31536000, max-age=31536000`
    );
    res.end(file);

    // const parsedReq = parseRequest(req);
    // const html = getHtml(parsedReq);
    // if (isHtmlDebug) {
    //     res.setHeader('Content-Type', 'text/html');
    //     res.end(html);
    //     return;
    // }
    // const { fileType } = parsedReq;
    // const file = await getScreenshot(html, fileType, isDev);
    // res.statusCode = 200;
    // res.setHeader('Content-Type', `image/${fileType}`);
    // res.setHeader('Cache-Control', `public, immutable, no-transform, s-maxage=31536000, max-age=31536000`);
    // res.end(file);
  } catch (e) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/html");
    res.end("<h1>Internal Error</h1><p>Sorry, there was a problem</p>");
    console.error(e);
  }
}
