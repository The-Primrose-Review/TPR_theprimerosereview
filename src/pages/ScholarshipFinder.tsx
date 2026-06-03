import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Trophy, Sparkles, Loader2, RefreshCw, Bookmark, BookmarkCheck,
  ExternalLink, ChevronRight, AlertCircle, CheckCircle2, Globe,
  GraduationCap, Target, Clock, Lightbulb, Info,
} from "lucide-react";
import {
  useScholarshipFinder,
  type EnrichedMatch,
  STUDY_COUNTRIES,
  DEGREE_TYPES,
  FIELDS_OF_STUDY,
  GPA_RANGES,
  BACKGROUND_TAGS,
} from "@/hooks/useScholarshipFinder";

// ── Config ────────────────────────────────────────────────────

const MATCH_CONFIG = {
  high: {
    label: "High match",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    badgeCls: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  possible: {
    label: "Possible",
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    dot: "bg-blue-500",
    badgeCls: "bg-blue-100 text-blue-700 border-blue-200",
  },
  reach: {
    label: "Reach",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    dot: "bg-amber-500",
    badgeCls: "bg-amber-100 text-amber-700 border-amber-200",
  },
} as const;

const COVERAGE_CONFIG = {
  full: { label: "Full funding", cls: "bg-violet-100 text-violet-700 border-violet-200" },
  partial: { label: "Partial", cls: "bg-sky-100 text-sky-700 border-sky-200" },
  stipend: { label: "Stipend", cls: "bg-teal-100 text-teal-700 border-teal-200" },
};

// ── Sub-components ────────────────────────────────────────────

const MatchBadge = ({ level }: { level: 'high' | 'possible' | 'reach' }) => {
  const cfg = MATCH_CONFIG[level];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.badgeCls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

const CoverageTag = ({ coverage }: { coverage: 'full' | 'partial' | 'stipend' }) => {
  const cfg = COVERAGE_CONFIG[coverage];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
};

const ScoreRing = ({ score, level }: { score: number; level: 'high' | 'possible' | 'reach' }) => {
  const cfg = MATCH_CONFIG[level];
  return (
    <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-full border-2 ${cfg.border} ${cfg.bg} shrink-0`}>
      <span className={`text-xl font-black leading-none ${cfg.text}`}>{score}</span>
      <span className={`text-[9px] font-medium uppercase tracking-wide ${cfg.text} opacity-80`}>match</span>
    </div>
  );
};

const ScholarshipCard = ({
  match,
  isSaved,
  onSave,
  onViewDetails,
}: {
  match: EnrichedMatch;
  isSaved: boolean;
  onSave: () => void;
  onViewDetails: () => void;
}) => {
  const { scholarship: s, matchLevel, matchScore, matchReason } = match;
  return (
    <div className={`rounded-2xl border-2 bg-white p-5 flex flex-col gap-4 hover:shadow-md transition-shadow ${MATCH_CONFIG[matchLevel].border}`}>
      {/* Header */}
      <div className="flex items-start gap-4">
        <ScoreRing score={matchScore} level={matchLevel} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-gray-900 text-base leading-snug">{s.name}</h3>
            <button
              onClick={e => { e.stopPropagation(); onSave(); }}
              className="text-gray-400 hover:text-violet-600 transition-colors shrink-0 mt-0.5"
              title={isSaved ? "Remove from saved" : "Save scholarship"}
            >
              {isSaved
                ? <BookmarkCheck className="h-5 w-5 text-violet-600" />
                : <Bookmark className="h-5 w-5" />
              }
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{s.provider}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <MatchBadge level={matchLevel} />
            <CoverageTag coverage={s.coverage} />
            <span className="text-xs text-gray-500 font-medium">{s.amount}</span>
          </div>
        </div>
      </div>

      {/* Eligibility + deadline */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
        <span className="flex items-center gap-1">
          <Globe className="h-3.5 w-3.5 text-gray-400" />
          {s.studyCountries.length ? s.studyCountries.join(', ') : 'Flexible location'}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5 text-gray-400" />
          {s.deadlineNote}
        </span>
      </div>

      <p className="text-sm text-gray-600 leading-snug">{s.eligibilitySummary}</p>

      {/* Match reason */}
      <div className={`rounded-xl px-3.5 py-2.5 text-sm ${MATCH_CONFIG[matchLevel].bg} ${MATCH_CONFIG[matchLevel].text} leading-snug`}>
        <span className="font-semibold">Why it matches: </span>
        {matchReason}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          onClick={onViewDetails}
          className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium"
        >
          View details
          <ChevronRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </div>
    </div>
  );
};

const DetailSheet = ({
  match,
  isSaved,
  onSave,
  onClose,
}: {
  match: EnrichedMatch | null;
  isSaved: boolean;
  onSave: () => void;
  onClose: () => void;
}) => {
  const s = match?.scholarship;
  if (!s || !match) return null;

  return (
    <Sheet open={!!match} onOpenChange={open => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto" side="right">
        <SheetHeader className="pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div>
              <SheetTitle className="text-xl font-black text-gray-900 leading-tight">{s.name}</SheetTitle>
              <p className="text-sm text-gray-500 mt-1">{s.provider}</p>
            </div>
            <button
              onClick={onSave}
              className="text-gray-400 hover:text-violet-600 transition-colors shrink-0 mt-1"
            >
              {isSaved
                ? <BookmarkCheck className="h-6 w-6 text-violet-600" />
                : <Bookmark className="h-6 w-6" />
              }
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <MatchBadge level={match.matchLevel} />
            <CoverageTag coverage={s.coverage} />
            <span className="text-sm font-semibold text-gray-700">{s.amount}</span>
          </div>
        </SheetHeader>

        <div className="space-y-6 py-6">

          {/* Match reason */}
          <div className={`rounded-xl px-4 py-3 ${MATCH_CONFIG[match.matchLevel].bg} border ${MATCH_CONFIG[match.matchLevel].border}`}>
            <p className={`text-sm font-semibold ${MATCH_CONFIG[match.matchLevel].text} mb-1`}>Why it matches you</p>
            <p className={`text-sm ${MATCH_CONFIG[match.matchLevel].text} leading-relaxed`}>{match.matchReason}</p>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
              <Info className="h-4 w-4 text-gray-400" />
              About this scholarship
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed">{s.description}</p>
          </div>

          {/* What it covers */}
          <div>
            <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              What it covers
            </h4>
            <ul className="space-y-1.5">
              {s.whatItCovers.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Requirements */}
          <div>
            <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
              <Target className="h-4 w-4 text-violet-500" />
              Key requirements
            </h4>
            <ul className="space-y-1.5">
              {s.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-violet-400 font-bold mt-0.5 shrink-0">•</span>
                  {req}
                </li>
              ))}
            </ul>
          </div>

          {/* Timeline */}
          <div>
            <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-amber-500" />
              Timeline
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed">{s.timeline}</p>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2 flex items-start gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              Deadline shown is approximate. Always verify the current cycle on the official site.
            </p>
          </div>

          {/* Personalized tips */}
          <div>
            <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
              <Lightbulb className="h-4 w-4 text-indigo-500" />
              Tips for your application
            </h4>
            <ul className="space-y-2.5">
              {match.personalizedTips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 bg-indigo-50 rounded-xl px-3.5 py-2.5 leading-snug">
                  <span className="text-indigo-500 font-bold shrink-0 mt-0.5">{i + 1}.</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* Official link */}
          <a
            href={s.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Visit official site
          </a>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// ── Main Page ─────────────────────────────────────────────────

export default function ScholarshipFinder() {
  const {
    profile,
    searchState,
    savedIds,
    selectedMatch,
    isProfileComplete,
    updateProfile,
    toggleBackgroundTag,
    toggleSaved,
    setSelectedMatch,
    findMatches,
    reset,
  } = useScholarshipFinder();

  const isLoading = searchState.status === 'loading';
  const hasResults = searchState.status === 'success';
  const matches = hasResults ? searchState.matches : [];

  const highMatches = matches.filter(m => m.matchLevel === 'high');
  const possibleMatches = matches.filter(m => m.matchLevel === 'possible');
  const reachMatches = matches.filter(m => m.matchLevel === 'reach');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/20 to-indigo-50/30">

      {/* ── Hero Header ── */}
      <div className="bg-gradient-to-br from-amber-50 via-white to-orange-50 border-b border-amber-100 px-6 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center">
              <Trophy className="h-5 w-5 text-amber-600" />
            </div>
            <span className="text-amber-500 text-sm font-medium uppercase tracking-widest">Scholarship Finder</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 leading-tight">Find what you actually qualify for.</h1>
          <p className="text-gray-500 mt-1 text-lg">
            Tell us about yourself. We'll match you to the right scholarships and explain why.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">

        {/* ── Profile Form ── */}
        {!hasResults && !isLoading && (
          <Card className="border-2 border-amber-100 shadow-lg shadow-amber-50/50 bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-gray-800 flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-amber-500" />
                Your profile
              </CardTitle>
              <p className="text-sm text-gray-500">5 quick fields — then we match you.</p>
            </CardHeader>
            <CardContent className="space-y-6 pt-2">

              {/* Row 1: Citizenship + Study Country */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="citizenship" className="text-sm font-semibold text-gray-700">
                    Your citizenship / nationality <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="citizenship"
                    value={profile.citizenship}
                    onChange={e => updateProfile({ citizenship: e.target.value })}
                    placeholder="e.g. American, British, Canadian..."
                    className="border-amber-100 focus:border-amber-300"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-gray-700">
                    Where do you want to study? <span className="text-red-400">*</span>
                  </Label>
                  <Select value={profile.studyCountry} onValueChange={v => updateProfile({ studyCountry: v })}>
                    <SelectTrigger className="border-amber-100 focus:border-amber-300">
                      <SelectValue placeholder="Select destination" />
                    </SelectTrigger>
                    <SelectContent>
                      {STUDY_COUNTRIES.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 2: Degree + Field */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-gray-700">
                    Degree level <span className="text-red-400">*</span>
                  </Label>
                  <Select value={profile.degreeType} onValueChange={v => updateProfile({ degreeType: v })}>
                    <SelectTrigger className="border-amber-100 focus:border-amber-300">
                      <SelectValue placeholder="Select degree" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEGREE_TYPES.map(d => (
                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-gray-700">
                    Field of study <span className="text-red-400">*</span>
                  </Label>
                  <Select value={profile.fieldOfStudy} onValueChange={v => updateProfile({ fieldOfStudy: v })}>
                    <SelectTrigger className="border-amber-100 focus:border-amber-300">
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELDS_OF_STUDY.map(f => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* GPA */}
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-gray-700">
                  Your GPA (approximate) <span className="text-red-400">*</span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {GPA_RANGES.map(g => (
                    <button
                      key={g.value}
                      onClick={() => updateProfile({ gpaRange: g.value })}
                      className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${
                        profile.gpaRange === g.value
                          ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300 hover:bg-amber-50'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Background tags */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Your background <span className="text-gray-400 font-normal">(optional — improves matching)</span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {BACKGROUND_TAGS.map(tag => {
                    const isSelected = profile.backgroundTags.includes(tag.value);
                    return (
                      <button
                        key={tag.value}
                        onClick={() => toggleBackgroundTag(tag.value)}
                        className={`px-3.5 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${
                          isSelected
                            ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300 hover:bg-violet-50'
                        }`}
                      >
                        {tag.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5" />
                  Deadline info is approximate — always verify on official sites.
                </p>
                <Button
                  onClick={findMatches}
                  disabled={!isProfileComplete}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold px-7 shadow-lg shadow-amber-200 disabled:opacity-40 disabled:shadow-none"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Find my matches
                </Button>
              </div>

              {searchState.status === 'error' && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-xl px-4 py-3">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {searchState.message}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Loading ── */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-28 gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-xl shadow-amber-200">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <div className="absolute inset-0 rounded-full border-4 border-amber-300 animate-ping opacity-60" />
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-gray-800">Finding your matches...</p>
              <p className="text-gray-500 mt-1">Analyzing {profile.citizenship} students in {profile.fieldOfStudy}.</p>
            </div>
          </div>
        )}

        {/* ── Results ── */}
        {hasResults && (
          <div className="space-y-6">

            {/* Results header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-2xl font-black text-gray-900">Your matches</h2>
                <p className="text-gray-500 text-sm mt-0.5">
                  {matches.length} scholarships found · Best fits first
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={reset}
                className="border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                New search
              </Button>
            </div>

            {/* Summary pills */}
            <div className="flex flex-wrap gap-2">
              {highMatches.length > 0 && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {highMatches.length} High match{highMatches.length > 1 ? 'es' : ''}
                </span>
              )}
              {possibleMatches.length > 0 && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  {possibleMatches.length} Possible
                </span>
              )}
              {reachMatches.length > 0 && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  {reachMatches.length} Reach
                </span>
              )}
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-1 gap-4">
              {matches.map(match => (
                <ScholarshipCard
                  key={match.scholarshipId}
                  match={match}
                  isSaved={savedIds.has(match.scholarshipId)}
                  onSave={() => toggleSaved(match.scholarshipId)}
                  onViewDetails={() => setSelectedMatch(match)}
                />
              ))}
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-gray-400" />
              <p>
                Scholarship details are based on historical data and AI analysis. Deadlines, amounts, and eligibility can change annually.
                Always verify on the official scholarship website before applying.
              </p>
            </div>
          </div>
        )}

      </div>

      {/* ── Detail Sheet ── */}
      <DetailSheet
        match={selectedMatch}
        isSaved={selectedMatch ? savedIds.has(selectedMatch.scholarshipId) : false}
        onSave={() => selectedMatch && toggleSaved(selectedMatch.scholarshipId)}
        onClose={() => setSelectedMatch(null)}
      />
    </div>
  );
}
