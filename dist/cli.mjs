#!/usr/bin/env node
var P=Object.defineProperty;var s=(e,t)=>P(e,"name",{value:t,configurable:!0});import{command as h,cli as _}from"cleye";import{cyan as x,blue as B,gray as j,green as v,yellow as G,dim as A,red as T}from"kolorist";import*as u from"@clack/prompts";import{execa as o}from"execa";import{generateText as O}from"ai";import{openai as S}from"@ai-sdk/openai";import{homedir as R}from"os";import{join as U}from"path";import{writeFileSync as D,existsSync as L,readFileSync as Y}from"fs";import N from"ini";const F=s(async()=>{try{const{stdout:e}=await o("git",["diff","--cached"]);return e}catch{const{stdout:e}=await o("git",["diff"]);return e}},"getGitDiff"),k=s(async()=>{const{stdout:e}=await o("git",["status","--short"]);return e},"getGitStatus"),K=s(async()=>{const{stdout:e}=await o("git",["rev-parse","--abbrev-ref","HEAD"]);return e},"getCurrentBranch"),M=s(async(e=5)=>{const{stdout:t}=await o("git",["log",`-${e}`,"--pretty=format:%s"]);return t.split(`
`)},"getRecentCommits"),H=s(async(e,t=!0)=>{t?await o("git",["checkout","-b",e]):await o("git",["branch",e])},"createBranch"),z=s(async()=>{try{return await o("git",["rev-parse","--git-dir"]),!0}catch{return!1}},"isGitRepository"),W=s(async()=>{try{const{stdout:e}=await o("git",["diff","--cached","--name-only"]),{stdout:t}=await o("git",["diff","--name-only"]),{stdout:a}=await o("git",["ls-files","--others","--exclude-standard"]),n=[...e.split(`
`),...t.split(`
`),...a.split(`
`)].filter(c=>c.trim()!=="");return[...new Set(n)]}catch{return[]}},"getChangedFiles"),q=s(e=>{if(e.length===0)return null;const t={docs:0,test:0,config:0,style:0,ci:0,src:0},a={docs:/\.(md|txt|pdf|doc|docx)$/i,test:/\.(test|spec)\.(ts|js|tsx|jsx)$|^tests?\//i,config:/^(package\.json|package-lock\.json|tsconfig\.json|\..*rc|.*\.config\.(ts|js))$/i,style:/\.(css|scss|sass|less|styl)$/i,ci:/^\.github\/workflows\//i,src:/^src\/.*\.(ts|js|tsx|jsx)$/i};e.forEach(c=>{a.docs.test(c)&&t.docs++,a.test.test(c)&&t.test++,a.config.test(c)&&t.config++,a.style.test(c)&&t.style++,a.ci.test(c)&&t.ci++,a.src.test(c)&&t.src++});const n=e.length;return t.docs===n?{type:"docs",confidence:"high"}:t.test===n?{type:"test",confidence:"high"}:t.ci===n?{type:"ci",confidence:"high"}:t.style===n?{type:"style",confidence:"high"}:t.config===n?{type:"chore",confidence:"high"}:t.docs/n>.7?{type:"docs",confidence:"medium"}:t.test/n>.7?{type:"test",confidence:"medium"}:t.ci/n>.7?{type:"ci",confidence:"medium"}:t.config/n>.6?{type:"chore",confidence:"medium"}:t.config>0&&t.src===0?{type:"chore",confidence:"low"}:t.src>0?{type:"feat",confidence:"low"}:{type:"feat",confidence:"low"}},"detectChangeType"),V=s(async()=>{try{const{stdout:e}=await o("git",["diff","--shortstat"]),t=e.match(/(\d+) files? changed(?:, (\d+) insertions?\(\+\))?(?:, (\d+) deletions?\(-\))?/);if(t)return{added:parseInt(t[2]||"0"),modified:parseInt(t[1]||"0"),deleted:parseInt(t[3]||"0")}}catch{}return{added:0,modified:0,deleted:0}},"getFileStats"),$=U(R(),".aibranch");async function d(){if(!L($))return{};const e=Y($,"utf-8");return N.parse(e)}s(d,"getConfig");async function J(){return d()}s(J,"getAllConfig");async function C(e,t){const a=await d();a[e]=t,D($,N.stringify(a))}s(C,"setConfig");async function Q(e){const t=await d(),a=`
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
  `,n=S(t.OPENAI_MODEL||"gpt-4o-mini",{apiKey:t.OPENAI_API_KEY,baseURL:t.OPENAI_BASE_URL}),{text:c}=await O({model:n,prompt:a,temperature:.7,maxTokens:200});return c.split(`
`).map(i=>i.trim()).filter(i=>i&&!i.match(/^\d+\./)).slice(0,e.count)}s(Q,"generateBranchNames");async function X(e){const t=await d(),a=`
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
  `,n=S(t.OPENAI_MODEL||"gpt-4o-mini",{apiKey:t.OPENAI_API_KEY,baseURL:t.OPENAI_BASE_URL}),{text:c}=await O({model:n,prompt:a,temperature:.5,maxTokens:200});return c.trim()}s(X,"generateDescription");async function Z(e){await z()||(u.cancel("Not a git repository!"),process.exit(1)),(await d()).OPENAI_API_KEY||(u.cancel("Please run `aibranch setup` first to configure your API key"),process.exit(1)),u.intro(x("\u{1F33F} AI Branch Name Generator"));const a=await W(),n=a.length>0;let c=e.description,i=e.type;if(n&&!c&&(!e.type||e.type==="feature")){const r=q(a);if(r){const b=r.confidence==="high"?"\u{1F3AF}":r.confidence==="medium"?"\u{1F3B2}":"\u{1F914}";u.note(`\u{1F4C1} ${a.length} file(s) changed
${B(`${b} Detected type: ${r.type} (${r.confidence} confidence)`)}
${j(`Files: ${a.slice(0,3).join(", ")}${a.length>3?"...":""}`)}`,"Auto-detection");const p=await u.select({message:"How do you want to proceed?",options:[{value:"auto",label:"\u{1F916} Auto-generate (AI will analyze changes and create branch)"},{value:"manual",label:"\u270F\uFE0F  Manual input (describe changes yourself)"}],initialValue:"auto"});if(u.isCancel(p)&&(u.cancel("Operation cancelled"),process.exit(0)),p==="auto"){const f=u.spinner();f.start("Analyzing changes...");try{const[m,w,g]=await Promise.all([F().catch(()=>""),k().catch(()=>""),V().catch(()=>({added:0,modified:0,deleted:0}))]);c=await X({files:a,diff:m.slice(0,2e3),status:w,fileStats:g}),f.stop("Changes analyzed!"),u.note(`${v("Generated description:")}
"${c}"`,"AI Analysis"),i=r.type}catch(m){f.stop("Analysis failed"),u.log.error(m.message)}}}}c||(c=await u.text({message:n?"Describe your changes:":"What is this branch for?",placeholder:n?"e.g., Update authentication docs":"e.g., Add user authentication feature"}),u.isCancel(c)&&(u.cancel("Operation cancelled"),process.exit(0))),(!i||i==="feature")&&(i=await u.select({message:"Select branch type:",options:[{value:"feat",label:"feat - A new feature"},{value:"fix",label:"fix - A bug fix"},{value:"docs",label:"docs - Documentation only changes"},{value:"style",label:"style - Code style changes (formatting, etc.)"},{value:"refactor",label:"refactor - Code refactoring"},{value:"perf",label:"perf - Performance improvements"},{value:"test",label:"test - Adding or updating tests"},{value:"chore",label:"chore - Build/tooling changes"},{value:"build",label:"build - Build system changes"},{value:"ci",label:"ci - CI configuration changes"},{value:"custom",label:"custom - Enter custom type"}]}),u.isCancel(i)&&(u.cancel("Operation cancelled"),process.exit(0)),i==="custom"&&(i=await u.text({message:"Enter custom branch type:",placeholder:"e.g., hotfix, experiment"}),u.isCancel(i)&&(u.cancel("Operation cancelled"),process.exit(0))));const y=u.spinner();y.start("Generating branch names with AI...");try{const[r,b,p,f]=await Promise.all([F().catch(()=>""),k().catch(()=>""),K().catch(()=>"main"),M().catch(()=>[])]),m=`
Current Branch: ${p}
Recent Commits: ${f.join(", ")}
Git Status: ${b}
${n?`Changed Files: ${a.join(", ")}`:""}
${r?`Recent Changes:
${r.slice(0,1e3)}`:""}
    `.trim(),w=await Q({context:m,description:c,type:i,count:e.generate||3});y.stop("Branch names generated!");const g=await u.select({message:"Select a branch name:",options:[...w.map(E=>({value:E,label:E})),{value:"__custom__",label:G("\u270F\uFE0F  Enter custom name")}]});u.isCancel(g)&&(u.cancel("Operation cancelled"),process.exit(0));let l=g;g==="__custom__"&&(l=await u.text({message:"Enter branch name:",placeholder:"feat/my-custom-branch"}),u.isCancel(l)&&(u.cancel("Operation cancelled"),process.exit(0)));const I=e.create||await u.confirm({message:`Create and checkout branch "${l}"?`});u.isCancel(I)&&(u.cancel("Operation cancelled"),process.exit(0)),I?(await H(l,!0),u.outro(v(`\u2713 Created and checked out branch: ${l}`))):u.outro(`Branch name: ${x(l)}`)}catch(r){y.stop("Failed to generate branch names"),u.cancel(r.message),process.exit(1)}}s(Z,"generateBranchCommand");const e0=h({name:"setup",description:"Setup AI provider configuration"},async()=>{u.intro("\u{1F527} AI Branch Setup");const e=await u.select({message:"Select AI provider:",options:[{value:"openai",label:"OpenAI"},{value:"togetherai",label:"TogetherAI (recommended)"},{value:"ollama",label:"Ollama (local)"},{value:"custom",label:"Custom OpenAI-compatible"}]});u.isCancel(e)&&(u.cancel("Setup cancelled"),process.exit(0));const t=await u.text({message:"Enter your API key:",placeholder:"sk-..."});u.isCancel(t)&&(u.cancel("Setup cancelled"),process.exit(0)),await C("OPENAI_API_KEY",t),await C("provider",e),u.outro("\u2713 Configuration saved!")}),t0=h({name:"get",parameters:["<key>"],description:"Get a configuration value"},async e=>{const t=await d(),a=e._.key,n=t[a];console.log(n===void 0?A(`Config key "${a}" not found`):n)}),u0=h({name:"set",parameters:["<key=value>"],description:"Set a configuration value"},async e=>{const t=e._,a=t["key=value"]||Object.values(t)[0];(!a||typeof a!="string")&&(console.error("Invalid format. Use: aibranch config set key=value"),process.exit(1));const[n,...c]=a.split("="),i=c.join("=");(!n||i===void 0||i==="")&&(console.error("Invalid format. Use: aibranch config set key=value"),process.exit(1)),await C(n,i),console.log(v(`\u2713 Set ${n}=${i}`))}),a0=h({name:"config",description:"Manage configuration",commands:[t0,u0]},async()=>{const e=await J();if(Object.keys(e).length===0){console.log(A("No configuration found. Run `aibranch setup` first."));return}console.log(x("Current configuration:")),console.log("");for(const[t,a]of Object.entries(e))t.includes("KEY")||t.includes("TOKEN")?console.log(`  ${t}: ${A("***"+a.slice(-4))}`):console.log(`  ${t}: ${a}`)}),n0=_({name:"aibranch",version:"1.0.0",commands:[e0,a0],flags:{generate:{type:Number,alias:"g",description:"Number of branch names to generate",default:3},description:{type:String,alias:"d",description:"Description of what the branch is for"},type:{type:String,alias:"t",description:"Branch type (feature/bugfix/hotfix/release)",default:"feature"},create:{type:Boolean,alias:"c",description:"Automatically create the selected branch",default:!1}}}),{flags:c0,command:i0}=n0;if(!i0)try{await Z(c0)}catch(e){console.error(T("Error:"),e.message),process.exit(1)}
