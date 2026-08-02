// This is the "backend" piece. It runs on Vercel's servers, never in a
// visitor's browser, so your API key (which lives in Vercel's private
// settings, not in this file) is never exposed to the public.
//
// The frontend page sends it a small request like:
//   { experience: "running a business", name: "Pauline", years: 3, months: 2, days: 1140 }
// and it sends back:
//   { text: "..." }  -- or  { text: null } if anything went wrong.

module.exports = async function handler(req, res) {
  // Allow the frontend (running on any domain, including your WordPress site)
  // to call this function.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  console.log('perspective function invoked, has key:', !!process.env.ANTHROPIC_API_KEY);

  try {
    var body = req.body || {};
    var experience = body.experience;
    var name = body.name;
    var years = body.years;
    var months = body.months;
    var days = body.days;

    if (!experience || !name || years === undefined || months === undefined || days === undefined) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Keep inputs reasonably short so nobody can send a huge payload.
    experience = String(experience).slice(0, 200);
    name = String(name).slice(0, 100);

    // Work out a tight, explicit acceptable range for the comparison fact,
    // so the model can't wander off into something 5x longer or shorter.
    // Longer experiences get a flat ~1 year of wiggle room either way;
    // shorter ones (under 2 years) get a proportionally tighter window.
    var totalYears = days / 365.25;
    var toleranceYears = totalYears < 2 ? Math.max(totalYears * 0.4, 0.15) : 1;
    var minYears = Math.max(0, totalYears - toleranceYears);
    var maxYears = totalYears + toleranceYears;
    var roundedTotal = Math.round(totalYears * 10) / 10;
    var roundedMin = Math.round(minYears * 10) / 10;
    var roundedMax = Math.round(maxYears * 10) / 10;

    var systemPrompt = [
      'You are writing one short paragraph for a personal web app called "The Lived Experience Calculator."',
      'A person has spent ' + years + ' years, ' + months + ' months, and ' + days + ' days total (about ' + roundedTotal + ' years) on this experience: "' + experience + '". Their name is ' + name + '.',
      'Use the web_search tool to find ONE real, specific fact about something else where a DURATION or AGE-AT-MILESTONE is the actual number \u2014 not just something old that happens to have an impressive stat.',
      'GOOD examples of the kind of fact to find: "the Sydney Opera House took 14 years to build," "a giant sequoia takes about 20 years to produce its first cone," "NASA\u2019s Voyager 1 took 35 years to leave the solar system," "a bonsai tree is considered mastered after roughly 25 years of training." Notice the number IS the elapsed time \u2014 that is the whole point of the fact.',
      'BAD examples (do not do this): "a whale that age weighs 100 tons," "a tree that old is very tall," "a person that age has done a lot." These are facts about something old, not facts about the passage of time itself \u2014 they don\u2019t count, even if a number is present.',
      'HARD REQUIREMENT: the duration or age-at-milestone you find must be between ' + roundedMin + ' and ' + roundedMax + ' years. Not several times longer, not several times shorter \u2014 it has to land inside that window. If your first idea doesn\u2019t fit, or doesn\u2019t have a real duration/age number in it, search again until you find one that does.',
      'Pick something that will make the reader go "wow, I did not know that" \u2014 genuinely surprising, with the specific number front and center. Do not pick anything about death, illness, violence, or prison.',
      'Do your searching and thinking silently. Do not narrate your process, do not say things like "let me search" or "that\u2019s a good match" or "let me verify," and do not think out loud anywhere in your reply.',
      'Then write a short paragraph, 3 to 4 sentences, in a warm, funny, encouraging voice \u2014 like a supportive friend who has seen a lot and believes in people. Write at a 7th-grade reading level: short sentences, everyday words, no jargon.',
      'Reference the fact you found, and tie it back to this person\u2019s exact experience ("' + experience + '") in a way that feels personal and specific, not generic.',
      'Output ONLY the finished paragraph and nothing before or after it. No preamble, no narration, no headers, no markdown, no quotation marks around the whole thing.'
    ].join(' ');

    var controller = new AbortController();
    var timeoutId = setTimeout(function () { controller.abort(); }, 20000);

    var anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 600,
        system: systemPrompt,
        messages: [{ role: 'user', content: 'Write the paragraph now.' }],
        tools: [{ type: 'web_search_20250305', name: 'web_search' }]
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!anthropicRes.ok) {
      var errBody = await anthropicRes.text();
      console.error('Anthropic API returned an error:', anthropicRes.status, errBody);
      res.status(200).json({ text: null, debug: 'Anthropic API error ' + anthropicRes.status + ': ' + errBody.slice(0, 300) });
      return;
    }

    var data = await anthropicRes.json();
    var textBlocks = (data.content || []).filter(function (block) { return block.type === 'text'; });
    var text = textBlocks.length ? textBlocks[textBlocks.length - 1].text.trim() : null;

    res.status(200).json({ text: text || null });
  } catch (err) {
    console.error('perspective function crashed:', err);
    res.status(200).json({ text: null, debug: String(err && err.message ? err.message : err) });
  }
};
