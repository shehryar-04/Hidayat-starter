import { useState } from 'react'
import {
  Sun,
  Moon,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Layers,
  Sparkles,
  Search,
  ExternalLink,
  ChevronRight,
  Trash2,
} from 'lucide-react'
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Input,
  Textarea,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Checkbox,
  Radio,
  RadioGroup,
  Switch,
  SearchInput,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Tabs,
  Modal,
  ConfirmDialog,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  KpiCard,
  EmptyState,
  ErrorState,
  PageHeader,
  useToast,
} from '../shared/ui'
import { useTheme } from '../theme/ThemeProvider'

export default function ThemeShowcase() {
  const { isDark, toggleMode, mode, setMode } = useTheme()
  const { toast } = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [searchValue, setSearchValue] = useState('')
  const [checkboxChecked, setCheckboxChecked] = useState(true)
  const [radioValue, setRadioValue] = useState('option-1')
  const [switchChecked, setSwitchChecked] = useState(true)

  return (
    <TooltipProvider>
      <div className="space-y-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Page Header with Live Theme Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white dark:bg-[#0f1a14] rounded-2xl border border-neutral-200/90 dark:border-[#1a2e23] shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-emerald-400">
                <Sparkles className="w-5 h-5" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-neutral-900 dark:text-white">
                Hidayat Theme System Workbench
              </h1>
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Interactive test bench to audit semantic tokens, color contrast, and component states in Light and Dark mode.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-neutral-100 dark:bg-[#14221b] p-1.5 rounded-xl border border-neutral-200/80 dark:border-[#1a2e23] self-start sm:self-center">
            <button
              onClick={() => setMode('light')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                !isDark
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              Light Mode
            </button>
            <button
              onClick={() => setMode('dark')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isDark
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-emerald-200" />
              Dark Mode
            </button>
          </div>
        </div>

        {/* 1. Semantic Color Tokens */}
        <section className="space-y-4">
          <h2 className="text-lg font-display font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary-500" />
            1. Semantic Surface & Color Palette
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-xl bg-white dark:bg-[#0f1a14] border border-neutral-200/90 dark:border-[#1a2e23] shadow-xs">
              <div className="w-full h-8 rounded-lg bg-neutral-50 dark:bg-[#070d0a] border border-neutral-200/80 dark:border-[#1a2e23] mb-2" />
              <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Page Background</p>
              <p className="text-[10px] text-neutral-400 font-mono">#f8f9fb / #070d0a</p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#0f1a14] border border-neutral-200/90 dark:border-[#1a2e23] shadow-xs">
              <div className="w-full h-8 rounded-lg bg-white dark:bg-[#0f1a14] border border-neutral-200/80 dark:border-[#1a2e23] mb-2" />
              <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Surface Card</p>
              <p className="text-[10px] text-neutral-400 font-mono">#ffffff / #0f1a14</p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#0f1a14] border border-neutral-200/90 dark:border-[#1a2e23] shadow-xs">
              <div className="w-full h-8 rounded-lg bg-neutral-100 dark:bg-[#14221b] border border-neutral-200/80 dark:border-[#1a2e23] mb-2" />
              <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Elevated Surface</p>
              <p className="text-[10px] text-neutral-400 font-mono">#ffffff / #14221b</p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#0f1a14] border border-neutral-200/90 dark:border-[#1a2e23] shadow-xs">
              <div className="w-full h-8 rounded-lg bg-primary-500 dark:bg-emerald-500 mb-2" />
              <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Primary Brand</p>
              <p className="text-[10px] text-neutral-400 font-mono">#2d8659 / #38b273</p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#0f1a14] border border-neutral-200/90 dark:border-[#1a2e23] shadow-xs">
              <div className="w-full h-8 rounded-lg bg-neutral-200 dark:bg-[#1a2e23] mb-2" />
              <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Theme Border</p>
              <p className="text-[10px] text-neutral-400 font-mono">#e2e5eb / #1a2e23</p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#0f1a14] border border-neutral-200/90 dark:border-[#1a2e23] shadow-xs">
              <div className="w-full h-8 rounded-lg bg-neutral-900 dark:bg-neutral-100 mb-2" />
              <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Primary Text</p>
              <p className="text-[10px] text-neutral-400 font-mono">#111826 / #f8f9fb</p>
            </div>
          </div>
        </section>

        {/* 2. Button Component Matrix */}
        <section className="space-y-4">
          <h2 className="text-lg font-display font-bold text-neutral-900 dark:text-white">
            2. Button Variants & States
          </h2>
          <div className="p-6 bg-white dark:bg-[#0f1a14] rounded-2xl border border-neutral-200/90 dark:border-[#1a2e23] shadow-xs space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="primary" loading>Loading</Button>
              <Button variant="primary" disabled>Disabled</Button>
            </div>
          </div>
        </section>

        {/* 3. Form Controls & Inputs */}
        <section className="space-y-4">
          <h2 className="text-lg font-display font-bold text-neutral-900 dark:text-white">
            3. Form Controls & Interactive Inputs
          </h2>

          <div className="p-6 bg-white dark:bg-[#0f1a14] rounded-2xl border border-neutral-200/90 dark:border-[#1a2e23] shadow-xs space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Standard Input</label>
                <Input
                  placeholder="Type something here…"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Error Input State</label>
                <Input
                  placeholder="Invalid email address"
                  defaultValue="invalid-email@"
                  error
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Disabled Input</label>
                <Input
                  placeholder="Disabled input"
                  disabled
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Search Input</label>
                <SearchInput
                  placeholder="Search articles, fatwas, or courses…"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Radix Select</label>
                <Select defaultValue="sunni-hanafi">
                  <SelectTrigger>
                    <SelectValue placeholder="Select School of Thought" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sunni-hanafi">Hanafi Jurisprudence</SelectItem>
                    <SelectItem value="sunni-shafii">Shafi'i Jurisprudence</SelectItem>
                    <SelectItem value="sunni-maliki">Maliki Jurisprudence</SelectItem>
                    <SelectItem value="sunni-hanbali">Hanbali Jurisprudence</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Textarea</label>
              <Textarea placeholder="Enter detailed notes or questions here…" rows={3} />
            </div>

            {/* Checkbox, Radio, Switch */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-neutral-100 dark:border-[#1a2e23]">
              <Checkbox
                label="Remember my preference"
                description="Keep logged in on this browser"
                checked={checkboxChecked}
                onChange={(e) => setCheckboxChecked(e.target.checked)}
              />

              <RadioGroup value={radioValue} onChange={(v) => setRadioValue(v)}>
                <Radio value="option-1" label="Active Semester" description="Current enrolled term" />
                <Radio value="option-2" label="Archived Term" description="Historical records" />
              </RadioGroup>

              <Switch
                label="Dark Mode Auto Sync"
                description="Sync with OS preference"
                checked={switchChecked}
                onChange={(c) => setSwitchChecked(c)}
              />
            </div>
          </div>
        </section>

        {/* 4. Badges & Semantic Status Chips */}
        <section className="space-y-4">
          <h2 className="text-lg font-display font-bold text-neutral-900 dark:text-white">
            4. Badges & Status Indicators
          </h2>
          <div className="p-6 bg-white dark:bg-[#0f1a14] rounded-2xl border border-neutral-200/90 dark:border-[#1a2e23] shadow-xs flex flex-wrap gap-3">
            <Badge variant="primary">Primary Badge</Badge>
            <Badge variant="success">Success Badge</Badge>
            <Badge variant="warning">Warning Badge</Badge>
            <Badge variant="error">Error Badge</Badge>
            <Badge variant="info">Info Badge</Badge>
            <Badge variant="secondary">Neutral Badge</Badge>
            <Badge variant="outline">Outline Badge</Badge>
          </div>
        </section>

        {/* 5. Dropdowns, Tooltips, Modals & Toasts */}
        <section className="space-y-4">
          <h2 className="text-lg font-display font-bold text-neutral-900 dark:text-white">
            5. Overlays, Portals, Tooltips & Toasts
          </h2>

          <div className="p-6 bg-white dark:bg-[#0f1a14] rounded-2xl border border-neutral-200/90 dark:border-[#1a2e23] shadow-xs flex flex-wrap items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Open Dropdown Menu</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>View Profile</DropdownMenuItem>
                <DropdownMenuItem>Course Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600 dark:text-red-400">Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="secondary">Hover for Tooltip</Button>
              </TooltipTrigger>
              <TooltipContent>
                This tooltip inherits elevated dark/light theme tokens!
              </TooltipContent>
            </Tooltip>

            <Button variant="outline" onClick={() => setModalOpen(true)}>
              Open Universal Modal
            </Button>

            <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
              Open Confirm Dialog
            </Button>

            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => toast.success('Saved Successfully', 'Your changes have been synced.')}
              >
                Trigger Success Toast
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => toast.error('Action Failed', 'Could not complete network request.')}
              >
                Trigger Error Toast
              </Button>
            </div>
          </div>
        </section>

        {/* 6. Tabs, KPI Cards and Data Table */}
        <section className="space-y-4">
          <h2 className="text-lg font-display font-bold text-neutral-900 dark:text-white">
            6. Tabs, KPI Cards & Structured Tables
          </h2>

          <Tabs
            items={[
              {
                label: 'KPI Overview',
                content: (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <KpiCard
                      title="Active Students"
                      value="1,420"
                      icon={CheckCircle2}
                      trend={{ value: 12.4, isPositive: true }}
                      description="Compared to last month"
                    />
                    <KpiCard
                      title="Fatwas Indexed"
                      value="70,412"
                      icon={Layers}
                      trend={{ value: 4.8, isPositive: true }}
                      description="Across 18 traditional categories"
                    />
                    <KpiCard
                      title="System Uptime"
                      value="99.98%"
                      icon={Sparkles}
                      description="High availability cluster"
                    />
                  </div>
                ),
              },
              {
                label: 'Course Registry Table',
                content: (
                  <div className="bg-white dark:bg-[#0f1a14] rounded-2xl border border-neutral-200/90 dark:border-[#1a2e23] overflow-hidden shadow-xs pt-1">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Course / Module</TableHead>
                          <TableHead>Instructor</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Students</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-semibold text-neutral-900 dark:text-white">
                            Usul al-Fiqh: Principles of Islamic Jurisprudence
                          </TableCell>
                          <TableCell>Mufti Abdul Rahman</TableCell>
                          <TableCell><Badge variant="success">Published</Badge></TableCell>
                          <TableCell className="text-right font-mono">482</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">Manage</Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-semibold text-neutral-900 dark:text-white">
                            Classical Arabic Grammar & Syntax
                          </TableCell>
                          <TableCell>Shaykh Tariq Mahmud</TableCell>
                          <TableCell><Badge variant="warning">Under Review</Badge></TableCell>
                          <TableCell className="text-right font-mono">194</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">Review</Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-semibold text-neutral-900 dark:text-white">
                            Hadith Studies: Sahih al-Bukhari Exegesis
                          </TableCell>
                          <TableCell>Maulana Zubair Khan</TableCell>
                          <TableCell><Badge variant="primary">Active</Badge></TableCell>
                          <TableCell className="text-right font-mono">310</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">Manage</Button>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                ),
              },
            ]}
          />
        </section>

        {/* Modal Dialog */}
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Theme System Modal Demo"
          description="Notice how the backdrop, surface, borders, close button, and footer seamlessly adapt to the selected theme."
          footer={
            <div className="flex items-center justify-end gap-3 w-full">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => setModalOpen(false)}>Confirm Action</Button>
            </div>
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              This modal dialog is mounted through React Portal and automatically consumes elevated surface tokens.
            </p>
            <Input placeholder="Interactive modal field" />
          </div>
        </Modal>

        {/* Confirm Dialog */}
        <ConfirmDialog
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={() => setConfirmOpen(false)}
          title="Delete Course Record"
          message="Are you sure you want to delete this course record? This action cannot be undone."
          confirmText="Delete Record"
          variant="danger"
        />
      </div>
    </TooltipProvider>
  )
}
