async function check() {
  const res = await fetch('https://eduvantages.netlify.app/');
  const html = await res.text();
  console.log(html.match(/https:\/\/[^\"]*\.supabase\.co/g));
}
check();
