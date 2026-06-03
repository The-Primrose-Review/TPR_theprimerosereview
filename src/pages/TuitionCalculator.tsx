import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  GraduationCap, Home, Plane, MapPin, Trophy,
  TrendingDown, Info, ChevronRight, RotateCcw,
  HeartPulse, BookOpen, ShieldAlert, Utensils, Bus,
  Lightbulb, MessageCircle, LayoutDashboard,
  Bookmark, BookmarkCheck, Trash2, Clock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  type Country, type DegreeType, type LivingStyle,
  COUNTRIES, DEGREE_TYPES, LIVING_STYLES, FIELDS_OF_STUDY,
  DURATION_OPTIONS, DEFAULT_DURATION, CITIES_BY_COUNTRY,
  getCosts, getAnnualTotal, getProgramTotal, getAffordability,
  getScholarshipReduction, getMonthlyLiving, generateInsights, formatUSD,
} from "@/data/tuitionData";

// ── Types ────────────────────────────────────────────────────────────────────
interface CostPlan {
  id: string;
  country: string;
  city: string | null;
  degree: string;
  field_of_study: string;
  living_style: string;
  duration_years: number;
  annual_min: number;
  annual_max: number;
  program_min: number;
  program_max: number;
  monthly_living_min: number;
  monthly_living_max: number;
  affordability: string;
  created_at: string;
}

// ── Affordability config ─────────────────────────────────────────────────────
const AFFORDABILITY_CONFIG = {
  affordable: { label: "Affordable", bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  moderate:   { label: "Moderate",   bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-700",   dot: "bg-amber-500"   },
  high:       { label: "High Cost",  bg: "bg-rose-50",    border: "border-rose-200",     text: "text-rose-700",    dot: "bg-rose-500"    },
} as const;

function range(min: number, max: number) {
  return `${formatUSD(min)} – ${formatUSD(max)}`;
}

function midpoint(min: number, max: number) {
  return Math.round((min + max) / 2);
}

function countryFlag(value: string) {
  return COUNTRIES.find(c => c.value === value)?.flag ?? "🌍";
}

function countryName(value: string) {
  return COUNTRIES.find(c => c.value === value)?.label ?? value;
}

function degreeName(value: string) {
  return DEGREE_TYPES.find(d => d.value === value)?.label ?? value;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Cost bar ─────────────────────────────────────────────────────────────────
interface CostBarProps {
  label: string;
  icon: React.ReactNode;
  min: number;
  max: number;
  totalMax: number;
  color: string;
}

function CostBar({ label, icon, min, max, totalMax, color }: CostBarProps) {
  const pct = Math.max(2, Math.round((midpoint(min, max) / totalMax) * 100));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span>{label}</span>
        </div>
        <span className="font-medium text-foreground">
          {range(min, max)}<span className="text-muted-foreground text-xs ml-1">/yr</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function TuitionCalculator() {
  const navigate = useNavigate();

  // form state
  const [country, setCountry]             = useState<Country | "">("");
  const [customCountry, setCustomCountry] = useState<string>("");
  const [city, setCity]                   = useState<string>("");
  const [customCity, setCustomCity]       = useState<string>("");
  const [degree, setDegree]               = useState<DegreeType | "">("");
  const [field, setField]                 = useState<string>("");
  const [living, setLiving]               = useState<LivingStyle>("standard");
  const [duration, setDuration]           = useState<number | null>(null);
  const [hasScholarship, setHasScholarship] = useState<"yes" | "no" | "maybe">("maybe");
  const [calculated, setCalculated]       = useState(false);

  // save / history state
  const [saveStatus, setSaveStatus]       = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [savedPlans, setSavedPlans]       = useState<CostPlan[]>([]);
  const [deletingId, setDeletingId]       = useState<string | null>(null);

  const isReady       = country !== "" && degree !== "" && field !== "";
  const isOtherCountry = country === "other";
  const isOtherCity   = city === "other";
  const cityOptions   = country && country !== "other" ? CITIES_BY_COUNTRY[country as Country] : [];

  const cityMultiplier = useMemo(() => {
    if (!city || city === "other") return 1.0;
    return cityOptions.find(c => c.value === city)?.livingMultiplier ?? 1.0;
  }, [city, cityOptions]);

  const effectiveDuration = duration ?? (degree ? DEFAULT_DURATION[degree as DegreeType] : 2);

  const result = useMemo(() => {
    if (!isReady || !calculated) return null;
    const costs       = getCosts(country as Country, degree as DegreeType, living, field, effectiveDuration, cityMultiplier);
    const annual      = getAnnualTotal(costs);
    const program     = getProgramTotal(annual, effectiveDuration);
    const affordability  = getAffordability(midpoint(annual.min, annual.max), country as Country);
    const scholarship = getScholarshipReduction(country as Country, degree as DegreeType);
    const monthlyLiving = getMonthlyLiving(costs);
    const insights    = generateInsights(costs, annual, country as Country, living);
    return { costs, annual, program, affordability, scholarship, monthlyLiving, insights };
  }, [country, degree, field, living, effectiveDuration, cityMultiplier, calculated]);

  // reset save status whenever a new calculation starts
  useEffect(() => {
    if (!calculated) setSaveStatus("idle");
  }, [calculated]);

  // load saved plans on mount
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("cost_plans")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (data) setSavedPlans(data as CostPlan[]);
    })();
  }, []);

  async function handleSavePlan() {
    if (!result || !isReady) return;
    setSaveStatus("saving");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaveStatus("error"); return; }
    const { data, error } = await supabase.from("cost_plans").insert({
      student_id:         user.id,
      country:            country,
      city:               city && city !== "other" ? city : (customCity || null),
      degree:             degree,
      field_of_study:     field,
      living_style:       living,
      duration_years:     effectiveDuration,
      city_multiplier:    cityMultiplier,
      annual_min:         result.annual.min,
      annual_max:         result.annual.max,
      program_min:        result.program.min,
      program_max:        result.program.max,
      monthly_living_min: result.monthlyLiving.min,
      monthly_living_max: result.monthlyLiving.max,
      affordability:      result.affordability,
    }).select().single();

    if (error || !data) {
      setSaveStatus("error");
      return;
    }
    setSaveStatus("saved");
    setSavedPlans(prev => [data as CostPlan, ...prev]);
  }

  async function handleDeletePlan(id: string) {
    setDeletingId(id);
    const { error } = await supabase.from("cost_plans").delete().eq("id", id);
    if (!error) setSavedPlans(prev => prev.filter(p => p.id !== id));
    setDeletingId(null);
  }

  function handleReset() {
    setCountry(""); setCustomCountry(""); setCity(""); setCustomCity("");
    setDegree(""); setField(""); setLiving("standard");
    setDuration(null); setHasScholarship("maybe"); setCalculated(false);
  }

  function handleCountryChange(v: string) {
    setCountry(v as Country);
    setCity(""); setCustomCity(""); setCalculated(false);
  }

  const affordCfg   = result ? AFFORDABILITY_CONFIG[result.affordability] : null;
  const countryLabel = COUNTRIES.find(c => c.value === country)?.label ?? customCountry ?? "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-sm">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Study Cost Planner</h1>
            <p className="text-sm text-muted-foreground">Understand what studying abroad will actually cost you</p>
          </div>
        </div>

        {/* ── Saved plans history ── */}
        {savedPlans.length > 0 && (
          <Card className="shadow-sm border-border/60">
            <CardHeader className="pb-2 pt-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-semibold text-foreground">Saved Plans</CardTitle>
                <Badge variant="secondary" className="text-xs ml-auto">{savedPlans.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-3 space-y-2">
              {savedPlans.map(plan => (
                <div
                  key={plan.id}
                  className="flex items-center gap-3 rounded-lg border border-border/50 bg-slate-50/60 px-3 py-2.5"
                >
                  <span className="text-lg leading-none">{countryFlag(plan.country)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {countryName(plan.country)} · {degreeName(plan.degree)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {range(plan.annual_min, plan.annual_max)}/yr · {formatDate(plan.created_at)}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs shrink-0 ${
                      plan.affordability === "affordable" ? "border-emerald-200 text-emerald-700 bg-emerald-50" :
                      plan.affordability === "moderate"   ? "border-amber-200 text-amber-700 bg-amber-50" :
                                                            "border-rose-200 text-rose-700 bg-rose-50"
                    }`}
                  >
                    {plan.affordability}
                  </Badge>
                  <button
                    onClick={() => handleDeletePlan(plan.id)}
                    disabled={deletingId === plan.id}
                    className="p-1 rounded text-muted-foreground hover:text-rose-500 hover:bg-rose-50 transition-colors disabled:opacity-40"
                    title="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* ── Input card ── */}
        <Card className="shadow-sm border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-foreground">Your Study Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">

            {/* Row 1 — country + degree */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Target Country</Label>
                <Select value={country} onValueChange={handleCountryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.flag} {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isOtherCountry && (
                  <Input
                    placeholder="Enter country name"
                    value={customCountry}
                    onChange={e => setCustomCountry(e.target.value)}
                    className="mt-2"
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Degree Type</Label>
                <Select value={degree} onValueChange={v => { setDegree(v as DegreeType); setDuration(null); setCalculated(false); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select degree" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEGREE_TYPES.map(d => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* City row */}
            {country && !isOtherCountry && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  City <span className="text-xs text-muted-foreground font-normal">(affects living costs)</span>
                </Label>
                <Select value={city} onValueChange={v => { setCity(v); setCustomCity(""); setCalculated(false); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select city (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {cityOptions.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isOtherCity && (
                  <Input
                    placeholder="Enter city name"
                    value={customCity}
                    onChange={e => setCustomCity(e.target.value)}
                    className="mt-2"
                  />
                )}
              </div>
            )}

            {/* Row 2 — field + duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Field of Study</Label>
                <Select value={field} onValueChange={v => { setField(v); setCalculated(false); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELDS_OF_STUDY.map(f => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Duration (years)
                  {degree && (
                    <span className="ml-1.5 text-xs text-muted-foreground font-normal">
                      — default {DEFAULT_DURATION[degree as DegreeType]}
                    </span>
                  )}
                </Label>
                <Select
                  value={duration?.toString() ?? ""}
                  onValueChange={v => { setDuration(Number(v)); setCalculated(false); }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={degree ? `${DEFAULT_DURATION[degree as DegreeType]} years (default)` : "Select duration"} />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map(y => (
                      <SelectItem key={y} value={y.toString()}>{y} {y === 1 ? "year" : "years"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 3 — living style */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Living Style</Label>
              <div className="grid grid-cols-3 gap-2">
                {LIVING_STYLES.map(ls => (
                  <button
                    key={ls.value}
                    onClick={() => { setLiving(ls.value); setCalculated(false); }}
                    className={`p-3 rounded-lg border text-left transition-all duration-150 ${
                      living === ls.value
                        ? "border-blue-500 bg-blue-50 ring-1 ring-blue-200"
                        : "border-border bg-background hover:border-blue-200 hover:bg-blue-50/40"
                    }`}
                  >
                    <div className="text-sm font-medium">{ls.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{ls.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Row 4 — scholarships */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Do you have scholarships?</Label>
              <div className="flex gap-2">
                {(["yes", "no", "maybe"] as const).map(opt => (
                  <button
                    key={opt}
                    onClick={() => setHasScholarship(opt)}
                    className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all duration-150 ${
                      hasScholarship === opt
                        ? "border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                        : "border-border text-muted-foreground hover:border-blue-200"
                    }`}
                  >
                    {opt === "yes" ? "Yes" : opt === "no" ? "No" : "Not sure yet"}
                  </button>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="flex gap-2 pt-1">
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                disabled={!isReady}
                onClick={() => { if (isReady) setCalculated(true); }}
              >
                <MapPin className="h-4 w-4 mr-2" />
                Plan My Costs
              </Button>
              {calculated && (
                <Button variant="outline" size="icon" onClick={handleReset} title="Reset">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
            </div>

            {!isReady && (
              <p className="text-xs text-muted-foreground text-center -mt-1">
                Select country, degree type, and field of study to continue
              </p>
            )}
          </CardContent>
        </Card>

        {/* ── Results ── */}
        {result && affordCfg && (
          <div className="space-y-4">

            {/* Affordability signal */}
            <div className={`rounded-xl border p-4 ${affordCfg.bg} ${affordCfg.border}`}>
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${affordCfg.dot}`} />
                <span className={`text-sm font-semibold ${affordCfg.text}`}>
                  This is considered: {affordCfg.label}
                </span>
              </div>
              <p className={`text-sm mt-1 ${affordCfg.text} opacity-80`}>
                Typical range for international students studying in {countryLabel}
              </p>
            </div>

            {/* Cost breakdown card */}
            <Card className="shadow-sm border-border/60">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Cost Breakdown</CardTitle>
                  <Badge variant="outline" className="text-xs text-muted-foreground">per year</Badge>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Info className="h-3 w-3" />
                  Based on {result.costs.cityContext}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <CostBar label="Tuition & fees"       icon={<GraduationCap className="h-4 w-4" />} min={result.costs.tuitionMin}         max={result.costs.tuitionMax}         totalMax={result.annual.max} color="bg-blue-500"   />
                  <CostBar label="Rent & housing"        icon={<Home          className="h-4 w-4" />} min={result.costs.rentMin}            max={result.costs.rentMax}            totalMax={result.annual.max} color="bg-violet-500" />
                  <CostBar label="Food & groceries"      icon={<Utensils      className="h-4 w-4" />} min={result.costs.foodMin}            max={result.costs.foodMax}            totalMax={result.annual.max} color="bg-amber-500"  />
                  <CostBar label="Transportation"        icon={<Bus           className="h-4 w-4" />} min={result.costs.transportMin}       max={result.costs.transportMax}       totalMax={result.annual.max} color="bg-teal-500"   />
                  <CostBar label="Health insurance"      icon={<HeartPulse    className="h-4 w-4" />} min={result.costs.healthInsuranceMin} max={result.costs.healthInsuranceMax} totalMax={result.annual.max} color="bg-teal-400"   />
                  <CostBar label="Visa, flights & travel" icon={<Plane        className="h-4 w-4" />} min={result.costs.visaFlightsMin}     max={result.costs.visaFlightsMax}     totalMax={result.annual.max} color="bg-rose-400"   />
                  <CostBar label="Books & materials"     icon={<BookOpen      className="h-4 w-4" />} min={result.costs.booksMin}           max={result.costs.booksMax}           totalMax={result.annual.max} color="bg-indigo-400" />
                  <CostBar label="Emergency buffer"      icon={<ShieldAlert   className="h-4 w-4" />} min={result.costs.emergencyBufferMin} max={result.costs.emergencyBufferMax} totalMax={result.annual.max} color="bg-slate-400"  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total per year</span>
                    <span className="text-lg font-bold text-foreground">
                      {range(result.annual.min, result.annual.max)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 border border-border/60 px-4 py-2">
                    <span className="text-sm text-muted-foreground">Estimated monthly living cost</span>
                    <span className="text-sm font-semibold text-foreground">
                      ~{formatUSD(midpoint(result.monthlyLiving.min, result.monthlyLiving.max))} / month
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 border border-border/60 px-4 py-3">
                    <div>
                      <div className="text-sm font-semibold text-foreground">Total program cost</div>
                      <div className="text-xs text-muted-foreground">{effectiveDuration} years</div>
                    </div>
                    <span className="text-xl font-bold text-blue-700">
                      {range(result.program.min, result.program.max)}
                    </span>
                  </div>
                </div>

                {/* Save button — inside the breakdown card, below totals */}
                <div className="pt-1">
                  {saveStatus === "saved" ? (
                    <Button disabled className="w-full bg-emerald-600 text-white gap-2">
                      <BookmarkCheck className="h-4 w-4" />
                      Plan saved
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      disabled={saveStatus === "saving"}
                      onClick={handleSavePlan}
                    >
                      <Bookmark className="h-4 w-4" />
                      {saveStatus === "saving" ? "Saving…" : saveStatus === "error" ? "Failed — try again" : "Save this plan"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Context insights */}
            {result.insights.length > 0 && (
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 space-y-2">
                <div className="flex items-center gap-1.5 text-blue-700 text-xs font-semibold uppercase tracking-wide">
                  <Lightbulb className="h-3.5 w-3.5" />
                  What this means for you
                </div>
                <ul className="space-y-1.5">
                  {result.insights.map((insight, i) => (
                    <li key={i} className="text-sm text-blue-800/80 italic flex gap-2">
                      <span className="mt-0.5 shrink-0 text-blue-400">›</span>
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Scholarship savings */}
            {hasScholarship !== "no" && (
              <Card className="shadow-sm border-emerald-200 bg-emerald-50/50">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-emerald-100 mt-0.5">
                      <TrendingDown className="h-4 w-4 text-emerald-700" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-emerald-800">
                        You could reduce this by{" "}
                        {range(result.scholarship.min, result.scholarship.max)} per year
                      </div>
                      <p className="text-xs text-emerald-700 mt-0.5 opacity-80">
                        Based on scholarships available for your degree and destination
                      </p>
                      <Button
                        size="sm"
                        className="mt-3 bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5"
                        onClick={() => navigate("/scholarship-finder")}
                      >
                        <Trophy className="h-3.5 w-3.5" />
                        View matching scholarships
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* What's next */}
            <Card className="shadow-sm border-border/60">
              <CardContent className="pt-5 pb-4">
                <div className="text-sm font-semibold text-foreground mb-3">What's next?</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Button variant="outline" className="justify-start gap-2 h-auto py-3 text-left" onClick={() => navigate("/scholarship-finder")}>
                    <Trophy className="h-4 w-4 text-amber-500 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold">Explore Scholarships</div>
                      <div className="text-xs text-muted-foreground font-normal">Find funding options</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="justify-start gap-2 h-auto py-3 text-left" onClick={() => navigate("/voice-ai")}>
                    <MessageCircle className="h-4 w-4 text-violet-500 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold">Talk to Eva</div>
                      <div className="text-xs text-muted-foreground font-normal">Get personalized advice</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="justify-start gap-2 h-auto py-3 text-left" onClick={() => navigate("/student-dashboard")}>
                    <LayoutDashboard className="h-4 w-4 text-blue-500 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold">Go to Dashboard</div>
                      <div className="text-xs text-muted-foreground font-normal">Back to your overview</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <p className="text-xs text-muted-foreground text-center pb-2">
              Estimates based on QS, UKCISA, DAAD & Numbeo averages (2024–25). Actual costs vary by institution and city.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
