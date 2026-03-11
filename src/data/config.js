const BASE_URL = import.meta.env.BASE_URL
const CDN = 'https://cdn.jsdelivr.net/gh/daiwikR/Daiwik_Portfolio@main/public/music'

export const CONFIG = {
  name: "Daiwik Reddy",
  role: "CS Student & Software Engineer",
  location: "Bangalore, India",
  tagline: "currently debugging something that was working five minutes ago",
  bio: "CS student at PES University (Class of '26), based in Bangalore. Interned at Myntra doing database work and at Neofysis Biotech shipping IoT pipelines on AWS. I build across the stack — event platforms, CV gym coaches, MLOps pipelines, agentic AI. Also I know too many programming languages.",
  github: "https://github.com/daiwikR",
  linkedin: "https://linkedin.com/in/daiwik-reddy-647702282",
  email: "daiwik004@gmail.com",
  music: [
    { title: "1000 BLUNTS",       artist: "$UICIDEBOY$",  src: `${CDN}/uicideboy-1000blunts.mp3` },
    { title: "Monochromatic",     artist: "$UICIDEBOY$",  src: `${CDN}/uicideboy-monochromatic.mp3` },
    { title: "Whatever Floats Your Boat Will Definitely Sink My Ship", artist: "$UICIDEBOY$", src: `${CDN}/uicideboy-whatever-floats.mp3` },
    { title: "Scope Set",         artist: "$uicideBoy$",  src: `${CDN}/uicideboy-scope-set.mp3` },
    { title: "Escape from Babylon", artist: "Unknown",    src: `${CDN}/escape-from-babylon.mp3` },
  ],
  skills: {
    "Python":       90,
    "JavaScript":   85,
    "TypeScript":   82,
    "React":        83,
    "Java":         75,
    "Node.js":      78,
    "FastAPI":      78,
    "Docker":       73,
    "AWS":          72,
    "MongoDB":      75,
    "Go":           60,
    "C++":          65,
  }
}
