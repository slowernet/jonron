# Google Analytics setup for Jonron

Property ID: `G-CG8MYVNYHZ`

## Step 1: Register custom dimensions

Without this step, event parameters only appear in Realtime and DebugView — not in standard reports or Explorations.

1. Open [Google Analytics](https://analytics.google.com)
2. Click the **gear icon** (Admin) in the bottom left
3. Under **Property**, click **Custom definitions**
4. Click **Create custom dimension** and add each row below:

| Dimension name | Event parameter | Scope |
|---|---|---|
| Game Mode | `mode` | Event |
| Result Type | `result_type` | Event |
| Play Type | `play_type` | Event |
| Inning | `inning` | Event |
| Half Inning | `half` | Event |
| K-O Letter | `ko_letter` | Event |
| Player ID | `player_id` | Event |
| Draft Round | `round` | Event |

5. Switch to the **Custom metrics** tab
6. Click **Create custom metric** and add each row below:

| Metric name | Event parameter | Scope | Unit |
|---|---|---|---|
| Score Home | `score_home` | Event | Standard |
| Score Visitor | `score_visitor` | Event | Standard |

## Step 2: Mark key events

1. Go to **Admin > Events**
2. Find `game:start` in the event list (it will appear after the first event fires)
3. Toggle **Mark as key event** for `game:start`
4. Do the same for `game:end`

This makes these events show up in the default Reports overview and acquisition reports.

## Step 3: Verify with Realtime

1. Open the live site: https://slowernet.github.io/jonron/
2. In GA, go to **Reports > Realtime**
3. Play a few at-bats
4. In the **Event count by Event name** card, you should see:
   - `game:start` on page load
   - `bat:spin` for each spin
   - `bat:ko` when fly balls / ground balls resolve
   - `strategy:call` when a strategy play is used
5. Click any event to inspect its parameter values

## Step 4: Enable DebugView (optional)

DebugView shows a detailed timeline of every event with full parameters. More useful than Realtime for verifying instrumentation.

**Option A — Chrome extension:**
Install the [GA Debugger extension](https://chrome.google.com/webstore/detail/google-analytics-debugger), enable it, then visit the site.

**Option B — URL parameter:**
Add `?debug_mode=true` to the site URL (requires a one-line code change to forward the param to gtag config).

Then go to **Admin > DebugView** to see the event stream.

## Step 5: Build Exploration — Result distribution

Data takes 24-48 hours to appear in Explorations after dimensions are registered. Once available:

Shows how often each batting outcome fires (sanity check for disc balance).

1. Go to **Explore** in the left sidebar
2. Click **Blank** to create a new exploration
3. Name it "Result distribution"
4. Add **Result Type** as a dimension
5. Add **Event count** as a metric
6. Drag Result Type to **Rows**
7. Drag Event count to **Values**
8. Add a filter: **Event name** exactly matches `bat:spin`

## Step 6: Build Exploration — Strategy usage

Shows which strategy plays people actually use.

1. Go to **Explore** in the left sidebar
2. Click **Blank** to create a new exploration
3. Name it "Strategy usage"
4. Add **Play Type** as a dimension
5. Add **Event count** as a metric
6. Drag Play Type to **Rows**
7. Drag Event count to **Values**
8. Add a filter: **Event name** exactly matches `strategy:call`

## Step 7: Build Exploration — Draft vs Quickstart

Shows which game mode is more popular.

1. Go to **Explore** in the left sidebar
2. Click **Blank** to create a new exploration
3. Name it "Draft vs Quickstart"
4. Add **Game Mode** as a dimension
5. Add **Event count** as a metric
6. Drag Game Mode to **Rows**
7. Drag Event count to **Values**
8. Add a filter: **Event name** exactly matches `game:start`

## Step 8: Build Exploration — Game completion

Shows whether people finish games.

1. Go to **Explore** in the left sidebar
2. Click **Blank** to create a new exploration
3. Name it "Game completion"
4. Create two segments:
   - **Started**: users who triggered `game:start`
   - **Finished**: users who triggered `game:end`
5. Add **Event count** as a metric
6. Compare the two segments to see drop-off rate

## Event reference

| Event | Params | Description |
|---|---|---|
| `game:start` | `mode` | Fired when a game begins |
| `game:end` | `innings`, `score_home`, `score_visitor` | Fired when a game ends |
| `draft:pick` | `round`, `player_id` | Fired for each draft pick |
| `bat:spin` | `inning`, `half`, `result_type` | Fired on every batting spin |
| `bat:ko` | `ko_letter` | Fired when K-O dial resolves |
| `strategy:call` | `play_type` | Fired when a strategy play or IBB is called |
