import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code2, Cpu, Terminal, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-24 px-4 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />

        <div className="container mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
            <Terminal className="h-4 w-4" />
            C++ Coding Practice Platform
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            Master <span className="gradient-text">C++</span> Programming
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Practice coding problems, sharpen your algorithms skills, and prepare
            for technical interviews with our curated C++ challenges.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 glow" asChild>
              <Link href="/problems">Start Practicing</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8" asChild>
              <Link href="/signin">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built for C++ Developers
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Everything you need to level up your C++ skills
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="card-hover bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Code2 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Curated Problems</CardTitle>
                <CardDescription className="text-base">
                  Hand-picked problems from easy to hard, covering all essential topics.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-hover bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Instant Feedback</CardTitle>
                <CardDescription className="text-base">
                  Run your code and get immediate results with detailed test case analysis.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-hover bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Cpu className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Real C++ Compiler</CardTitle>
                <CardDescription className="text-base">
                  GCC compiler with full C++17 support. Write real C++ code, not pseudocode.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-hover bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Terminal className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">VS Code Editor</CardTitle>
                <CardDescription className="text-base">
                  Monaco editor with syntax highlighting, autocomplete, and more.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="relative rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-purple-500/20 p-12 md:p-20 text-center overflow-hidden">
            <div className="absolute inset-0 bg-card/80 backdrop-blur-sm" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Code?</h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
                Join developers who are sharpening their C++ skills every day.
              </p>
              <Button size="lg" className="text-lg px-8" asChild>
                <Link href="/problems">Browse Problems</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-4">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-primary" />
            <span className="font-semibold">cppninja</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} cppninja. Built for C++ developers.
          </p>
        </div>
      </footer>
    </div>
  );
}
