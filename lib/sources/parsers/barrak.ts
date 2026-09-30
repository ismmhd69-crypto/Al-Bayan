import { htmlToText, looksLikeQuestion, sharesContentWord, stripLetterAndFormula, type ParsedFatwa } from "../scholar-excerpt";

type BarrakPost = {
  title?: unknown;
  question?: unknown;
  content?: unknown;
  type?: { title?: unknown; link?: unknown };
};

function removeOpeningFormula(answer: string): string {
  // The site commonly begins with praise and salawat, ending "أما بعد:". It is the Shaykh's
  // wording, but not the answer itself. Remove it only when it is the opening of the answer.
  const opening = /^الحمد لله[\s\S]{0,280}?أما بعد\s*:\s*/.exec(answer);
  return opening ? answer.slice(opening[0].length).trim() : answer;
}

function postFrom(html: string): BarrakPost | null {
  const script = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i)?.[1];
  if (!script) return null;
  try {
    const post = (JSON.parse(script) as { props?: { pageProps?: { postContent?: BarrakPost } } }).props?.pageProps?.postContent;
    return post ?? null;
  } catch {
    return null;
  }
}

// sh-albarrak.com exposes the written question and answer in __NEXT_DATA__. The answer ends before
// the site's explicit "Dictated by" signature, so the question and any later page material cannot enter.
export function parseBarrakFatwa(html: string): ParsedFatwa | null {
  const post = postFrom(html);
  if (!post || typeof post.title !== "string" || typeof post.question !== "string" || typeof post.content !== "string") return null;
  if (post.type?.title !== "فتاوى" && post.type?.link !== "/fatwas") return null;

  const title = htmlToText(post.title);
  const question = htmlToText(post.question);
  const contentText = htmlToText(post.content);
  const signoff = /(?:^|\n)أملاه\s*:\s*\nعبد(?:\s*ال)?رحمن\s+بن\s+ناصر\s+البراك(?:\n|$)/.exec(contentText);
  if (!title || !question || !signoff) return null;

  const answer = stripLetterAndFormula(removeOpeningFormula(contentText.slice(0, signoff.index).trim()));
  if (answer.length < 40 || looksLikeQuestion(answer) || !sharesContentWord(title, answer)) return null;
  return { title, answer, printedSource: null };
}
