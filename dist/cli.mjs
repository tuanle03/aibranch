#!/usr/bin/env node
var G=Object.defineProperty;var o=(e,t)=>G(e,"name",{value:t,configurable:!0});import{command as h,cli as T}from"cleye";import{cyan as b,blue as L,gray as D,green as d,yellow as O,dim as $,red as Y}from"kolorist";import*as u from"@clack/prompts";import{execa as s}from"execa";import{generateText as E}from"ai";import{openai as F}from"@ai-sdk/openai";import{homedir as K}from"os";import{join as C,dirname as _}from"path";import{writeFileSync as M,existsSync as H,readFileSync as A}from"fs";import P from"ini";import{fileURLToPath as U}from"url";import V from"update-notifier";const j=o(async()=>{try{const{stdout:e}=await s("git",["diff","--cached"]);return e}catch{const{stdout:e}=await s("git",["diff"]);return e}},"getGitDiff"),B=o(async()=>{const{stdout:e}=await s("git",["status","--short"]);return e},"getGitStatus"),J=o(async()=>{const{stdout:e}=await s("git",["rev-parse","--abbrev-ref","HEAD"]);return e},"getCurrentBranch"),z=o(async(e=5)=>{const{stdout:t}=await s("git",["log",`-${e}`,"--pretty=format:%s"]);return t.split(`
`)},"getRecentCommits"),W=o(async(e,t=!0)=>{t?await s("git",["checkout","-b",e]):await s("git",["branch",e])},"createBranch"),q=o(async()=>{try{return await s("git",["rev-parse","--git-dir"]),!0}catch{return!1}},"isGitRepository"),Q=o(async()=>{try{const{stdout:e}=await s("git",["diff","--cached","--name-only"]),{stdout:t}=await s("git",["diff","--name-only"]),{stdout:a}=await s("git",["ls-files","--others","--exclude-standard"]),n=[...e.split(`
`),...t.split(`
`),...a.split(`
`)].filter(i=>i.trim()!=="");return[...new Set(n)]}catch{return[]}},"getChangedFiles"),X=o(e=>{if(e.length===0)return null;const t={docs:0,test:0,config:0,style:0,ci:0,src:0},a={docs:/\.(md|txt|pdf|doc|docx)$/i,test:/\.(test|spec)\.(ts|js|tsx|jsx)$|^tests?\//i,config:/^(package\.json|package-lock\.json|tsconfig\.json|\..*rc|.*\.config\.(ts|js))$/i,style:/\.(css|scss|sass|less|styl)$/i,ci:/^\.github\/workflows\//i,src:/^src\/.*\.(ts|js|tsx|jsx)$/i};e.forEach(i=>{a.docs.test(i)&&t.docs++,a.test.test(i)&&t.test++,a.config.test(i)&&t.config++,a.style.test(i)&&t.style++,a.ci.test(i)&&t.ci++,a.src.test(i)&&t.src++});const n=e.length;return t.docs===n?{type:"docs",confidence:"high"}:t.test===n?{type:"test",confidence:"high"}:t.ci===n?{type:"ci",confidence:"high"}:t.style===n?{type:"style",confidence:"high"}:t.config===n?{type:"chore",confidence:"high"}:t.docs/n>.7?{type:"docs",confidence:"medium"}:t.test/n>.7?{type:"test",confidence:"medium"}:t.ci/n>.7?{type:"ci",confidence:"medium"}:t.config/n>.6?{type:"chore",confidence:"medium"}:t.config>0&&t.src===0?{type:"chore",confidence:"low"}:t.src>0?{type:"feat",confidence:"low"}:{type:"feat",confidence:"low"}},"detectChangeType"),Z=o(async()=>{try{const{stdout:e}=await s("git",["diff","--shortstat"]),t=e.match(/(\d+) files? changed(?:, (\d+) insertions?\(\+\))?(?:, (\d+) deletions?\(-\))?/);if(t)return{added:parseInt(t[2]||"0"),modified:parseInt(t[1]||"0"),deleted:parseInt(t[3]||"0")}}catch{}return{added:0,modified:0,deleted:0}},"getFileStats"),k=C(K(),".aibranch");async function f(){if(!H(k))return{};const e=A(k,"utf-8");return P.parse(e)}o(f,"getConfig");async function e0(){return f()}o(e0,"getAllConfig");async function S(e,t){const a=await f();a[e]=t,M(k,P.stringify(a))}o(S,"setConfig");async function t0(e){const t=await f(),a=`
  You are a senior Git workflow architect and naming convention specialist.

  Your task is to generate Git branch names that strictly follow:
  - Conventional Commits philosophy
  - Clean Git flow practices
  - Human-readable, production-grade naming

  You must infer the intent of the changes from the context below and
  translate that intent into short, meaningful branch names.

  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  INPUT
  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  Branch Type: ${e.type}

  ${e.description?`Task Description (human summary):
  ${e.description}`:""}

  Git Context (raw signals from repo):
  ${e.context}

  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  NAMING RULES
  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  1. Format:
     <type>/<short-action-object>

     Example:
     feat/add-user-auth
     fix/login-redirect
     docs/update-readme

  2. Constraints:
     - lowercase only
     - words separated by hyphens
     - no special characters
     - no trailing slashes
     - maximum length: 100 characters

  3. Semantic Rules:
     - Must describe WHAT is being changed
     - Must NOT describe HOW
     - Must avoid generic words (update, change, improve)
     - Prefer verb-noun structure (add-user, fix-bug, remove-cache)

  4. Allowed types:
     feat, fix, docs, style, refactor, perf, test, chore, build, ci

  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  OUTPUT RULES
  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  - Generate exactly ${e.count} unique branch names
  - One per line
  - No numbering
  - No explanations
  - No markdown
  - No extra text

  Return only the branch names.
  `,n=F(t.OPENAI_MODEL||"gpt-4o-mini",{apiKey:t.OPENAI_API_KEY,baseURL:t.OPENAI_BASE_URL}),{text:i}=await E({model:n,prompt:a,temperature:.7,maxTokens:200});return i.split(`
`).map(c=>c.trim()).filter(c=>c&&!c.match(/^\d+\./)).slice(0,e.count)}o(t0,"generateBranchNames");async function u0(e){const t=await f(),a=`
  You are a senior Git reviewer.

  Your job is to analyze a set of git changes and infer
  the **single most important intention** behind them.

  You must summarize the change as if it were a commit subject line.

  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  REPO SIGNALS
  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

  Changed Files (${e.files.length}):
  ${e.files.slice(0,10).join(`
`)}
  ${e.files.length>10?`... and ${e.files.length-10} more`:""}

  Git Status:
  ${e.status}

  Stats:
  +${e.fileStats.added}  -${e.fileStats.deleted}
  (${e.fileStats.modified} files changed)

  Git Diff (partial context):
  ${e.diff}

  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  DESCRIPTION RULES
  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  - Output a single sentence
  - Use imperative mood
    (e.g., "Add feature", not "Added feature")
  - Describe WHAT changed, not HOW
  - Be specific, avoid vague words
  - Max length: 200 characters
  - No punctuation at the end

  Examples:
  - Add user authentication
  - Fix login redirect bug
  - Update invoice export logic
  - Refactor payment gateway adapter

  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  OUTPUT
  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  Return ONLY the description.
  No quotes.
  No markdown.
  No extra words.
  `,n=F(t.OPENAI_MODEL||"gpt-4o-mini",{apiKey:t.OPENAI_API_KEY,baseURL:t.OPENAI_BASE_URL}),{text:i}=await E({model:n,prompt:a,temperature:.5,maxTokens:200});return i.trim()}o(u0,"generateDescription");async function a0(e){await q()||(u.cancel("Not a git repository!"),process.exit(1)),(await f()).OPENAI_API_KEY||(u.cancel("Please run `aibranch setup` first to configure your API key"),process.exit(1)),u.intro(b("\u{1F33F} AI Branch Name Generator"));const a=await Q(),n=a.length>0;let i=e.description,c=e.type;if(n&&!i&&(!e.type||e.type==="feature")){const r=X(a);if(r){const v=r.confidence==="high"?"\u{1F3AF}":r.confidence==="medium"?"\u{1F3B2}":"\u{1F914}";u.note(`\u{1F4C1} ${a.length} file(s) changed
${L(`${v} Detected type: ${r.type} (${r.confidence} confidence)`)}
${D(`Files: ${a.slice(0,3).join(", ")}${a.length>3?"...":""}`)}`,"Auto-detection");const y=await u.select({message:"How do you want to proceed?",options:[{value:"auto",label:"\u{1F916} Auto-generate (AI will analyze changes and create branch)"},{value:"manual",label:"\u270F\uFE0F  Manual input (describe changes yourself)"}],initialValue:"auto"});if(u.isCancel(y)&&(u.cancel("Operation cancelled"),process.exit(0)),y==="auto"){const p=u.spinner();p.start("Analyzing changes...");try{const[m,x,g]=await Promise.all([j().catch(()=>""),B().catch(()=>""),Z().catch(()=>({added:0,modified:0,deleted:0}))]);i=await u0({files:a,diff:m.slice(0,2e3),status:x,fileStats:g}),p.stop("Changes analyzed!"),u.note(`${d("Generated description:")}
"${i}"`,"AI Analysis"),c=r.type}catch(m){p.stop("Analysis failed"),u.log.error(m.message)}}}}i||(i=await u.text({message:n?"Describe your changes:":"What is this branch for?",placeholder:n?"e.g., Update authentication docs":"e.g., Add user authentication feature"}),u.isCancel(i)&&(u.cancel("Operation cancelled"),process.exit(0))),(!c||c==="feature")&&(c=await u.select({message:"Select branch type:",options:[{value:"feat",label:"feat - A new feature"},{value:"fix",label:"fix - A bug fix"},{value:"docs",label:"docs - Documentation only changes"},{value:"style",label:"style - Code style changes (formatting, etc.)"},{value:"refactor",label:"refactor - Code refactoring"},{value:"perf",label:"perf - Performance improvements"},{value:"test",label:"test - Adding or updating tests"},{value:"chore",label:"chore - Build/tooling changes"},{value:"build",label:"build - Build system changes"},{value:"ci",label:"ci - CI configuration changes"},{value:"custom",label:"custom - Enter custom type"}]}),u.isCancel(c)&&(u.cancel("Operation cancelled"),process.exit(0)),c==="custom"&&(c=await u.text({message:"Enter custom branch type:",placeholder:"e.g., hotfix, experiment"}),u.isCancel(c)&&(u.cancel("Operation cancelled"),process.exit(0))));const w=u.spinner();w.start("Generating branch names with AI...");try{const[r,v,y,p]=await Promise.all([j().catch(()=>""),B().catch(()=>""),J().catch(()=>"main"),z().catch(()=>[])]),m=`
Current Branch: ${y}
Recent Commits: ${p.join(", ")}
Git Status: ${v}
${n?`Changed Files: ${a.join(", ")}`:""}
${r?`Recent Changes:
${r.slice(0,1e3)}`:""}
    `.trim(),x=await t0({context:m,description:i,type:c,count:e.generate||3});w.stop("Branch names generated!");const g=await u.select({message:"Select a branch name:",options:[...x.map(N=>({value:N,label:N})),{value:"__custom__",label:O("\u270F\uFE0F  Enter custom name")}]});u.isCancel(g)&&(u.cancel("Operation cancelled"),process.exit(0));let l=g;g==="__custom__"&&(l=await u.text({message:"Enter branch name:",placeholder:"feat/my-custom-branch"}),u.isCancel(l)&&(u.cancel("Operation cancelled"),process.exit(0)));const I=e.create||await u.confirm({message:`Create and checkout branch "${l}"?`});u.isCancel(I)&&(u.cancel("Operation cancelled"),process.exit(0)),I?(await W(l,!0),u.outro(d(`\u2713 Created and checked out branch: ${l}`))):u.outro(`Branch name: ${b(l)}`)}catch(r){w.stop("Failed to generate branch names"),u.cancel(r.message),process.exit(1)}}o(a0,"generateBranchCommand");const n0=h({name:"setup",description:"Setup AI provider configuration"},async()=>{u.intro("\u{1F527} AI Branch Setup");const e=await u.select({message:"Select AI provider:",options:[{value:"openai",label:"OpenAI"},{value:"togetherai",label:"TogetherAI (recommended)"},{value:"ollama",label:"Ollama (local)"},{value:"custom",label:"Custom OpenAI-compatible"}]});u.isCancel(e)&&(u.cancel("Setup cancelled"),process.exit(0));const t=await u.text({message:"Enter your API key:",placeholder:"sk-..."});u.isCancel(t)&&(u.cancel("Setup cancelled"),process.exit(0)),await S("OPENAI_API_KEY",t),await S("provider",e),u.outro("\u2713 Configuration saved!")}),i0=h({name:"get",parameters:["<key>"],description:"Get a configuration value"},async e=>{const t=await f(),a=e._.key,n=t[a];console.log(n===void 0?$(`Config key "${a}" not found`):n)}),c0=h({name:"set",parameters:["<key=value>"],description:"Set a configuration value"},async e=>{const t=e._,a=t["key=value"]||Object.values(t)[0];(!a||typeof a!="string")&&(console.error("Invalid format. Use: aibranch config set key=value"),process.exit(1));const[n,...i]=a.split("="),c=i.join("=");(!n||c===void 0||c==="")&&(console.error("Invalid format. Use: aibranch config set key=value"),process.exit(1)),await S(n,c),console.log(d(`\u2713 Set ${n}=${c}`))}),o0=h({name:"config",description:"Manage configuration",commands:[i0,c0]},async()=>{const e=await e0();if(Object.keys(e).length===0){console.log($("No configuration found. Run `aibranch setup` first."));return}console.log(b("Current configuration:")),console.log("");for(const[t,a]of Object.entries(e))t.includes("KEY")||t.includes("TOKEN")?console.log(`  ${t}: ${$("***"+a.slice(-4))}`):console.log(`  ${t}: ${a}`)}),s0=U(import.meta.url),r0=_(s0);function l0(){try{const e=C(r0,"../../package.json");return JSON.parse(A(e,"utf-8")).version}catch{return"unknown"}}o(l0,"getCurrentVersion$1");const d0=h({name:"update",description:"Update aibranch to the latest version"},async()=>{u.intro(b("\u{1F504} Update aibranch"));const e=u.spinner();e.start("Checking for updates...");try{const{stdout:t}=await s("npm",["view","@tuanle03/aibranch","version"]),a=l0();if(e.stop("Update check complete"),a===t.trim()){u.outro(d(`\u2713 Already on the latest version (${a})`));return}u.note(`Current: ${O(a)}
Latest:  ${d(t.trim())}`,"Version Info");const n=await u.confirm({message:`Update to version ${t.trim()}?`});if(u.isCancel(n)||!n){u.cancel("Update cancelled");return}const i=u.spinner();i.start("Updating aibranch..."),await s("npm",["install","-g","@tuanle03/aibranch@latest"],{stdio:"inherit"}),i.stop("Update complete!"),u.outro(d(`\u2713 Successfully updated to version ${t.trim()}

Run 'aibranch --version' to verify`))}catch(t){e.stop("Update failed"),u.cancel(t.message),process.exit(1)}}),f0=U(import.meta.url),p0=_(f0),m0=C(p0,"../../package.json"),R=JSON.parse(A(m0,"utf-8"));function g0(){const e=V({pkg:R,updateCheckInterval:864e5});e.update&&e.notify({defer:!1,isGlobal:!0,message:`
\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510
\u2502                                                 \u2502
\u2502   \u{1F389} Update available for {packageName}        \u2502
\u2502                                                 \u2502
\u2502   {currentVersion} \u2192 {latestVersion}            \u2502
\u2502                                                 \u2502
\u2502   Run the following to update:                 \u2502
\u2502   npm install -g {packageName}                 \u2502
\u2502                                                 \u2502
\u2502   Changelog:                                    \u2502
\u2502   https://github.com/tuanle03/aibranch/releases\u2502
\u2502                                                 \u2502
\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518
    `.trim()})}o(g0,"checkForUpdates");function h0(){return R.version}o(h0,"getCurrentVersion"),g0();const y0=T({name:"aibranch",version:h0(),commands:[n0,o0,d0],flags:{generate:{type:Number,alias:"g",description:"Number of branch names to generate",default:3},description:{type:String,alias:"d",description:"Description of what the branch is for"},type:{type:String,alias:"t",description:"Branch type (feat/fix/docs/style/refactor/perf/test/chore/build/ci)",default:"feature"},create:{type:Boolean,alias:"c",description:"Automatically create the selected branch",default:!1}}}),{flags:b0,command:w0}=y0;if(!w0)try{await a0(b0)}catch(e){console.error(Y("Error:"),e.message),process.exit(1)}
