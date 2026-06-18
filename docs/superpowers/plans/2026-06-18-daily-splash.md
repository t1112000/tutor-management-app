# Daily Splash Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a fullscreen motivational splash screen with 3D effects and typewriter text once per calendar day (VN timezone), tracked via localStorage, dismissable via a button.

**Architecture:** A single `DailySplash` Client Component lives in `src/components/layout/DailySplash.tsx` and is mounted inside the dashboard layout so it fires on every authenticated route. Message data lives in a separate `src/lib/splash-messages.ts` file. No external animation libraries needed — all effects use CSS keyframes and JS DOM manipulation.

**Tech Stack:** Next.js 15 App Router, React, Tailwind CSS (keyframes only), `localStorage` for daily tracking, `DeviceOrientationEvent` for gyroscope, inline CSS for performance-critical animations.

## Global Constraints

- Vietnamese-language app; all user-facing strings in Vietnamese
- App primary color: `#E8788A`
- App background desktop: `/bg-main.png`, mobile (< 768px): `/bg-mobile.png`
- VN timezone: `Asia/Ho_Chi_Minh`
- No automated tests in this project — use manual browser verification steps
- Target: mobile-first, works on both iOS Safari and Android Chrome
- `localStorage` key: `myclass_splash_date`, value format: `YYYY-MM-DD`
- No external animation or 3D libraries — pure CSS + JS DOM

---

### Task 1: Message data file

**Files:**
- Create: `src/lib/splash-messages.ts`

**Interfaces:**
- Produces: `export const SPLASH_MESSAGES: string[]` — array of ~500 Vietnamese motivational messages used by `DailySplash`

- [ ] **Step 1: Create `src/lib/splash-messages.ts`**

```typescript
export const SPLASH_MESSAGES: string[] = [
  "🌷 Bé Mi hôm nay đã chuẩn bị bài học chưa nè?",
  "☀️ Chúc Bé Mi hôm nay thật nhiều năng lượng để đi dạy nhé!",
  "💖 Chúc cô giáo Bé Mi luôn vui vẻ và gặp thật nhiều điều tốt đẹp.",
  "📚 Hôm nay Bé Mi sẽ dạy bài gì vậy nè?",
  "🥰 Đừng quên ăn sáng trước khi đi dạy nhé Bé Mi.",
  "✨ Bé Mi cố lên! Hôm nay chắc chắn sẽ là một ngày tuyệt vời.",
  "🌸 Mỗi ngày đi dạy là thêm một ngày Bé Mi gieo những hạt giống tri thức.",
  "😆 Học sinh hôm nay nhớ ngoan nha, đừng làm cô Bé Mi đau đầu!",
  "🫶 Chúc Bé Mi luôn giữ nụ cười xinh suốt cả ngày.",
  "🍀 Một ngày may mắn đang chờ Bé Mi đó!",
  "💐 Chúc cô giáo Bé Mi có thật nhiều sức khỏe và niềm vui.",
  "🌈 Chúc Bé Mi có một ngày nhẹ nhàng và đầy tiếng cười.",
  "😚 Bé Mi nhớ uống đủ nước nha, đừng mải mê dạy học quá đó.",
  "🎉 Chúc Bé Mi hôm nay lên lớp thật tự tin và tràn đầy năng lượng.",
  "💝 Bé Mi là cô giáo tuyệt vời nhất hôm nay luôn!",
  "🥳 Hôm nay hãy cười thật nhiều nha cô giáo đáng yêu.",
  "🌷 Chúc Bé Mi mọi việc suôn sẻ, học sinh chăm ngoan.",
  "💪 Cố lên Bé Mi! Bạn làm được mọi thứ mà.",
  "🧸 Bé Mi ơi, hôm nay cũng phải thật hạnh phúc nhé.",
  "😜 Nếu học sinh quậy quá thì cứ nghĩ tới đồ ăn ngon sau giờ dạy nha.",
  "🌟 Một ngày mới bắt đầu rồi, Bé Mi tỏa sáng thôi nào!",
  "💞 Mong rằng hôm nay Bé Mi sẽ nhận được thật nhiều niềm vui.",
  "☕ Cô giáo Bé Mi đã uống cà phê chưa nè?",
  "🌻 Dù hôm nay có bận thế nào thì cũng nhớ chăm sóc bản thân nhé.",
  "😊 Nụ cười của Bé Mi chính là nguồn năng lượng tuyệt vời nhất.",
  "🎈 Chúc Bé Mi hôm nay thật bình an và nhiều tiếng cười.",
  "📖 Mỗi tiết học của Bé Mi đều thật ý nghĩa đó.",
  "🌹 Chúc Bé Mi luôn xinh đẹp và yêu đời.",
  "🥰 Chỉ cần Bé Mi vui thì hôm nay đã là một ngày tuyệt vời rồi.",
  "🐻 Bé Mi ơi, hôm nay nhớ ăn ngon và ngủ đủ nha.",
  "✨ Chúc cô giáo Bé Mi vừa dạy giỏi vừa luôn hạnh phúc.",
  "🌤️ Hôm nay trời đẹp, Bé Mi cũng phải vui thật nhiều nhé.",
  "🎀 Bé Mi xứng đáng với tất cả những điều tốt đẹp nhất.",
  "💌 Có người luôn mong Bé Mi thật vui mỗi ngày.",
  "🌸 Hãy bắt đầu ngày mới bằng một nụ cười thật tươi nha Bé Mi.",
  "🫰 Chúc Bé Mi hôm nay gặp toàn chuyện dễ thương.",
  "😄 Đừng áp lực quá nhé, Bé Mi đã làm rất tốt rồi.",
  "🌺 Chúc cô giáo Bé Mi luôn tràn đầy nhiệt huyết với nghề.",
  "💕 Hôm nay cũng là một ngày để Bé Mi yêu thương bản thân nhiều hơn.",
  "🌞 Dậy thôi Bé Mi ơi, ngày mới đang chờ cô giáo đáng yêu đó.",
  "🍓 Chúc Bé Mi có một ngày ngọt ngào như trái dâu vậy.",
  "📚 Bài giảng hôm nay chắc chắn sẽ thật tuyệt vì có Bé Mi.",
  "💗 Hãy luôn vui vẻ và yêu đời nha Bé Mi.",
  "🌼 Chúc Bé Mi gặp nhiều may mắn trong mọi việc hôm nay.",
  "🥛 Nhớ uống sữa hoặc ăn sáng đầy đủ nha cô giáo.",
  "😋 Trưa nay Bé Mi nhớ ăn món mình thích nhé.",
  "🌷 Mỗi ngày Bé Mi đều làm cho thế giới trở nên tốt đẹp hơn.",
  "💪 Bé Mi cố lên, hôm nay sẽ thật tuyệt.",
  "🎶 Hãy bật bài hát yêu thích và bắt đầu ngày mới nào.",
  "🌈 Điều tốt đẹp nhất hôm nay là Bé Mi luôn mỉm cười.",
  "🥰 Mong Bé Mi luôn được yêu thương và trân trọng.",
  "☀️ Một ngày rực rỡ đang đợi Bé Mi phía trước.",
  "🌹 Bé Mi hôm nay cũng phải thật xinh đẹp nhé.",
  "💐 Chúc Bé Mi đi dạy thật vui và về nhà thật hạnh phúc.",
  "🍀 May mắn sẽ luôn ở bên Bé Mi.",
  "😆 Nếu mệt quá thì hãy nghỉ ngơi một chút nhé.",
  "🎈 Chúc Bé Mi có thật nhiều niềm vui nhỏ trong ngày.",
  "🧁 Hôm nay tự thưởng cho mình một món ngon nha Bé Mi.",
  "🌟 Cô giáo Bé Mi luôn là phiên bản tuyệt vời nhất.",
  "💖 Chúc Bé Mi luôn giữ được trái tim ấm áp.",
  "🌷 Hôm nay học sinh sẽ rất thích tiết học của Bé Mi đó.",
  "😚 Gửi Bé Mi một cái ôm thật to cho ngày mới.",
  "📚 Chúc Bé Mi có thật nhiều cảm hứng khi giảng dạy.",
  "🌸 Mọi nỗ lực của Bé Mi đều rất đáng quý.",
  "☕ Một ly cà phê và một ngày thật vui nhé.",
  "💝 Chúc Bé Mi luôn được yêu thương.",
  "🌤️ Dù trời nắng hay mưa, Bé Mi vẫn phải thật vui nhé.",
  "😄 Hôm nay hãy cười nhiều hơn hôm qua nha.",
  "🌻 Chúc Bé Mi luôn rạng rỡ như ánh mặt trời.",
  "🫶 Có người luôn âm thầm cổ vũ Bé Mi đó.",
  "💪 Bé Mi mạnh mẽ hơn những gì mình nghĩ.",
  "🎀 Hôm nay hãy làm những điều khiến mình hạnh phúc nhé.",
  "🌹 Chúc Bé Mi bình an trong mọi khoảnh khắc.",
  "🥰 Một ngày đẹp bắt đầu bằng nụ cười của Bé Mi.",
  "🍓 Chúc Bé Mi ngọt ngào và vui vẻ cả ngày.",
  "🌈 Hạnh phúc sẽ tìm đến Bé Mi hôm nay.",
  "📖 Mỗi bài giảng của Bé Mi đều chứa đựng yêu thương.",
  "💞 Mong Bé Mi luôn giữ được sự nhiệt huyết.",
  "🌷 Hôm nay cũng là một ngày đáng yêu của Bé Mi.",
  "😋 Đừng quên ăn uống đầy đủ nha cô giáo.",
  "✨ Bé Mi hãy luôn tin vào bản thân nhé.",
  "🌺 Chúc Bé Mi thật nhiều sức khỏe.",
  "🎉 Một ngày mới, một niềm vui mới.",
  "💗 Bé Mi xứng đáng với mọi điều tốt đẹp.",
  "🌞 Chúc Bé Mi luôn tràn đầy năng lượng.",
  "☕ Hôm nay uống cà phê ít thôi nha Bé Mi.",
  "🥳 Chúc cô giáo Bé Mi có một ngày tuyệt vời.",
  "🌸 Bé Mi hôm nay nhớ giữ tâm trạng thật tốt nhé.",
  "💌 Gửi Bé Mi một lời chúc bình an.",
  "🌈 Dù có khó khăn gì cũng hãy mỉm cười nhé.",
  "😆 Học sinh quậy chút thôi, Bé Mi đừng giận nha.",
  "🌷 Chúc Bé Mi luôn gặp người tốt và chuyện vui.",
  "💪 Bé Mi luôn làm rất tốt rồi.",
  "🎈 Hôm nay hãy tận hưởng từng khoảnh khắc nhé.",
  "💖 Bé Mi là niềm tự hào của rất nhiều người.",
  "🌹 Chúc Bé Mi luôn xinh đẹp và tự tin.",
  "🥰 Mong mọi điều tốt đẹp sẽ đến với Bé Mi hôm nay.",
  "🌻 Hãy sống thật vui vẻ nha cô giáo đáng yêu.",
  "☀️ Chúc Bé Mi một ngày thật nhẹ nhàng.",
  "🫰 Bé Mi ơi, hôm nay cũng phải thật hạnh phúc nhé.",
  "🌷 Bé Mi ơi, hôm nay hãy bắt đầu ngày mới bằng một nụ cười thật tươi nhé.",
  "☀️ Chúc Bé Mi có một ngày dạy học thật vui và đầy cảm hứng.",
  "💖 Mỗi ngày Bé Mi đều tỏa sáng theo cách rất riêng đó.",
  "📚 Hôm nay cũng là một ngày tuyệt vời để lan tỏa tri thức nha.",
  "🥰 Chúc Bé Mi luôn vui vẻ, khỏe mạnh và yêu đời.",
  "🌸 Một cô giáo đáng yêu như Bé Mi chắc chắn sẽ có một ngày thật đẹp.",
  "🍀 Chúc may mắn luôn đồng hành cùng Bé Mi.",
  "😚 Bé Mi nhớ ăn sáng đầy đủ nha.",
  "🎀 Hôm nay hãy yêu thương bản thân nhiều hơn một chút nhé.",
  "💐 Chúc Bé Mi có thật nhiều năng lượng tích cực.",
  "🌈 Mong rằng hôm nay Bé Mi sẽ gặp thật nhiều niềm vui.",
  "🫶 Bé Mi luôn là phiên bản tuyệt vời nhất.",
  "🌹 Chúc mọi điều tốt đẹp sẽ đến với Bé Mi hôm nay.",
  "☕ Một ngày mới và một ly cà phê thơm dành cho Bé Mi.",
  "💝 Hôm nay cũng phải thật hạnh phúc nhé cô giáo đáng yêu.",
  "😄 Bé Mi cười lên nào, hôm nay sẽ là một ngày tuyệt vời đó.",
  "🌻 Chúc Bé Mi luôn giữ được sự nhiệt huyết với nghề.",
  "✨ Tự tin lên nhé, Bé Mi làm được mà.",
  "🥳 Hôm nay hãy tận hưởng từng khoảnh khắc thật vui nha.",
  "📖 Những bài giảng của Bé Mi luôn rất ý nghĩa.",
  "💗 Mong Bé Mi luôn được yêu thương và trân trọng.",
  "🌷 Học sinh hôm nay chắc sẽ rất thích tiết học của Bé Mi.",
  "🍓 Chúc Bé Mi có một ngày ngọt ngào như những quả dâu chín.",
  "😋 Trưa nay nhớ ăn ngon nha Bé Mi.",
  "🌞 Một ngày đầy nắng và đầy tiếng cười đang chờ Bé Mi.",
  "🎈 Hôm nay hãy làm điều khiến mình vui nhé.",
  "💪 Bé Mi mạnh mẽ và giỏi giang lắm đó.",
  "🌸 Đừng quên nghỉ ngơi khi cảm thấy mệt nha.",
  "☀️ Chúc Bé Mi thật nhiều sức khỏe.",
  "💌 Có người luôn mong Bé Mi được bình an mỗi ngày.",
  "🌈 Dù hôm nay thế nào thì cũng hãy vui lên nhé.",
  "🥰 Bé Mi xứng đáng với mọi điều tốt đẹp.",
  "🌷 Một ngày nhẹ nhàng và thật nhiều niềm vui nhé.",
  "📚 Chúc Bé Mi dạy thật tốt hôm nay.",
  "💖 Hãy luôn tự hào về chính mình nha.",
  "🌻 Bé Mi hôm nay cũng thật đáng yêu.",
  "☕ Đừng quên uống nước đầy đủ nhé.",
  "😄 Cười lên nào Bé Mi.",
  "🌹 Mong mọi điều thuận lợi sẽ đến với Bé Mi.",
  "💞 Chúc Bé Mi luôn vui vẻ và lạc quan.",
  "🌸 Hôm nay hãy thật dịu dàng với bản thân nhé.",
  "✨ Bé Mi luôn là cô giáo tuyệt vời.",
  "🥳 Hôm nay chắc chắn sẽ là một ngày đáng nhớ.",
  "🌈 Mỗi ngày là một cơ hội mới để tỏa sáng.",
  "🍀 May mắn sẽ luôn mỉm cười với Bé Mi.",
  "💪 Cố lên nha cô giáo xinh đẹp.",
  "🌷 Bé Mi hôm nay phải thật vui nha.",
  "💐 Chúc Bé Mi luôn rạng rỡ.",
  "😚 Gửi Bé Mi một cái ôm thật to.",
  "📖 Hôm nay hãy truyền thật nhiều cảm hứng nhé.",
  "🌞 Nắng lên rồi, Bé Mi cũng phải vui lên nha.",
  "💝 Bé Mi luôn rất đặc biệt.",
  "🌻 Chúc Bé Mi gặp nhiều điều tốt đẹp.",
  "🎀 Hôm nay hãy tự thưởng cho mình một món ngon nhé.",
  "🥰 Một ngày bình yên đang chờ Bé Mi.",
  "☕ Chúc Bé Mi có một buổi sáng thật thư thái.",
  "🌸 Dù bận rộn thế nào cũng nhớ chăm sóc bản thân nhé.",
  "💗 Bé Mi hôm nay nhất định phải thật hạnh phúc.",
  "🌷 Hãy luôn giữ nụ cười trên môi nhé.",
  "🍓 Chúc Bé Mi ngọt ngào như chính nụ cười của mình.",
  "😆 Nếu học sinh quậy thì cứ cười thôi nha.",
  "💪 Bé Mi làm rất tốt rồi.",
  "🌈 Điều tuyệt vời nhất hôm nay là Bé Mi luôn vui.",
  "🌹 Chúc Bé Mi mọi việc hanh thông.",
  "📚 Cô giáo Bé Mi hôm nay cũng sẽ thật tỏa sáng.",
  "💖 Hãy tin vào bản thân mình nhé.",
  "🥳 Một ngày mới, thật nhiều năng lượng mới.",
  "🌻 Bé Mi luôn là niềm tự hào.",
  "☀️ Chúc ngày mới của Bé Mi thật rực rỡ.",
  "💌 Gửi Bé Mi lời chúc an lành.",
  "🌸 Hôm nay đừng quên yêu thương bản thân nha.",
  "😄 Nụ cười của Bé Mi thật đẹp.",
  "🍀 Chúc Bé Mi gặp thật nhiều may mắn.",
  "✨ Bé Mi luôn tỏa ra năng lượng tích cực.",
  "💐 Mong mọi điều tốt lành đến với Bé Mi.",
  "🌈 Chúc Bé Mi có một ngày thật đáng yêu.",
  "📖 Hãy tiếp tục lan tỏa tri thức nhé.",
  "🥰 Bé Mi là cô giáo rất tuyệt vời.",
  "🌷 Một ngày thật bình yên nha.",
  "💖 Hôm nay hãy cười nhiều hơn hôm qua nhé.",
  "☕ Chúc Bé Mi có một ngày thật nhẹ nhàng.",
  "🌻 Mọi nỗ lực của Bé Mi đều xứng đáng.",
  "💞 Bé Mi ơi, cố lên nhé.",
  "😚 Hôm nay nhớ ăn thật ngon nha.",
  "🌸 Chúc Bé Mi luôn giữ được sự lạc quan.",
  "🎀 Hôm nay hãy làm điều mình thích nhé.",
  "🌞 Bé Mi chính là ánh nắng của hôm nay.",
  "🍓 Chúc Bé Mi luôn vui tươi.",
  "💪 Không gì có thể làm khó Bé Mi đâu.",
  "🌈 Hôm nay sẽ là một ngày đầy niềm vui.",
  "💝 Chúc Bé Mi thật nhiều tiếng cười.",
  "🌷 Bé Mi luôn xứng đáng được yêu thương.",
  "📚 Tiết học hôm nay chắc chắn sẽ rất thú vị.",
  "☀️ Chúc Bé Mi luôn khỏe mạnh.",
  "💖 Một ngày mới, một niềm vui mới.",
  "🥰 Bé Mi hãy luôn là chính mình nhé.",
  "🌻 Hạnh phúc sẽ luôn ở bên Bé Mi.",
  "✨ Chúc Bé Mi có thật nhiều năng lượng.",
  "💐 Hôm nay hãy thật vui nhé cô giáo Bé Mi.",
  "🌷 Chào ngày mới nhé Bé Mi, hôm nay nhất định sẽ là một ngày tuyệt vời.",
  "☀️ Dậy thôi cô giáo Bé Mi ơi, ánh nắng đang chờ nụ cười của bạn đó.",
  "💖 Chúc Bé Mi hôm nay thật nhiều niềm vui và ít áp lực nhé.",
  "📚 Hôm nay Bé Mi lại tiếp tục truyền cảm hứng cho học sinh rồi.",
  "🥰 Có người đang âm thầm chúc Bé Mi thật hạnh phúc mỗi ngày đó.",
  "🌸 Bé Mi nhớ ăn sáng trước khi đi dạy nha.",
  "🍀 Mong rằng hôm nay mọi chuyện đều suôn sẻ với Bé Mi.",
  "😆 Học sinh có quậy thì Bé Mi cũng phải cười thật tươi nha.",
  "💐 Chúc Bé Mi một ngày bình an và thật nhiều tiếng cười.",
  "🌈 Dù hôm nay thế nào thì Bé Mi vẫn rất tuyệt vời.",
  "☕ Bé Mi đã uống cà phê chưa nè?",
  "💝 Hôm nay hãy làm điều khiến bản thân vui nhé.",
  "🌻 Bé Mi xứng đáng với tất cả những điều tốt đẹp nhất.",
  "🎀 Chúc cô giáo Bé Mi luôn xinh đẹp và yêu đời.",
  "💪 Cố lên nha Bé Mi, bạn giỏi lắm đó.",
  "🥳 Hôm nay chắc chắn sẽ có rất nhiều điều dễ thương chờ Bé Mi.",
  "🌹 Chúc Bé Mi luôn giữ được nụ cười trên môi.",
  "📖 Những bài giảng của Bé Mi luôn thật ý nghĩa.",
  "💞 Mong rằng hôm nay Bé Mi sẽ gặp toàn chuyện vui.",
  "🌷 Một ngày mới, một nguồn năng lượng mới nhé.",
  "🍓 Chúc Bé Mi ngọt ngào như những trái dâu chín.",
  "🌞 Bé Mi hôm nay cũng phải thật rạng rỡ nha.",
  "😚 Đừng quên uống nhiều nước nhé cô giáo.",
  "✨ Hôm nay hãy thật tự tin nhé Bé Mi.",
  "💖 Nụ cười của Bé Mi là điều tuyệt vời nhất hôm nay.",
  "🌸 Dù bận rộn cũng nhớ nghỉ ngơi nha.",
  "🎈 Chúc Bé Mi có một ngày nhẹ nhàng.",
  "☀️ Ánh nắng hôm nay đẹp, Bé Mi cũng phải thật vui nhé.",
  "💌 Có người luôn mong Bé Mi được bình an.",
  "🌻 Hôm nay cũng là một ngày để Bé Mi tỏa sáng.",
  "😄 Cười lên nào Bé Mi ơi.",
  "📚 Chúc Bé Mi lên lớp thật nhiều năng lượng.",
  "💪 Mọi khó khăn rồi sẽ qua thôi.",
  "🌈 Hạnh phúc đang ở rất gần Bé Mi đó.",
  "🥰 Bé Mi hãy luôn yêu thương bản thân nhé.",
  "🌹 Chúc Bé Mi có thật nhiều sức khỏe.",
  "🍀 May mắn sẽ luôn ở bên Bé Mi.",
  "☕ Một ngày mới với thật nhiều niềm vui nhé.",
  "💖 Bé Mi hôm nay vẫn đáng yêu như mọi ngày.",
  "🌸 Hãy bắt đầu ngày mới bằng một nụ cười nhé.",
  "📖 Học sinh chắc hẳn rất thích tiết học của Bé Mi.",
  "🎀 Chúc Bé Mi luôn giữ được sự nhiệt huyết.",
  "🌷 Mọi điều tốt đẹp rồi sẽ đến với Bé Mi.",
  "😆 Nếu mệt thì hãy nghỉ ngơi một chút nhé.",
  "💐 Hôm nay hãy tự thưởng cho mình một món ngon nha.",
  "🌞 Chúc Bé Mi có thật nhiều năng lượng tích cực.",
  "💞 Bé Mi luôn là phiên bản tuyệt vời nhất.",
  "🥳 Hôm nay phải thật vui nhé.",
  "🌈 Một ngày thật đẹp đang chờ Bé Mi.",
  "☀️ Chúc Bé Mi luôn vui vẻ và lạc quan.",
  "💖 Bé Mi chính là niềm tự hào của rất nhiều người.",
  "🌸 Đừng quên chăm sóc bản thân nha.",
  "🍓 Chúc Bé Mi ngọt ngào cả ngày.",
  "😚 Gửi Bé Mi một cái ôm thật to.",
  "📚 Chúc Bé Mi có những tiết học thật thú vị.",
  "🌻 Mỗi ngày Bé Mi đều lan tỏa điều tích cực.",
  "💪 Bé Mi mạnh mẽ hơn mình nghĩ rất nhiều.",
  "🎈 Chúc Bé Mi có thật nhiều tiếng cười.",
  "🌹 Hôm nay hãy luôn mỉm cười nhé.",
  "💌 Có người luôn dõi theo và cổ vũ Bé Mi.",
  "☕ Bé Mi nhớ ăn sáng nha.",
  "🌷 Chúc Bé Mi thật nhiều may mắn.",
  "🥰 Hôm nay nhất định phải thật hạnh phúc nhé.",
  "💖 Một ngày tuyệt vời bắt đầu rồi.",
  "🌸 Bé Mi hãy luôn là chính mình nhé.",
  "🌞 Chúc Bé Mi bình an trong mọi khoảnh khắc.",
  "🍀 Hôm nay mọi chuyện sẽ ổn thôi.",
  "😄 Bé Mi cười lên đi nào.",
  "📖 Chúc Bé Mi có thật nhiều cảm hứng.",
  "💐 Hôm nay hãy sống thật vui vẻ nhé.",
  "🌻 Bé Mi luôn tỏa sáng theo cách riêng.",
  "💪 Cố lên nha cô giáo đáng yêu.",
  "🎀 Chúc Bé Mi luôn được yêu thương.",
  "🌈 Một ngày mới với nhiều điều tốt đẹp.",
  "☀️ Bé Mi hôm nay phải thật khỏe mạnh nhé.",
  "💞 Chúc Bé Mi luôn vui vẻ.",
  "🥳 Hôm nay hãy tận hưởng từng khoảnh khắc.",
  "🌷 Bé Mi thật tuyệt vời.",
  "💖 Chúc Bé Mi có một ngày an yên.",
  "🍓 Một chút ngọt ngào cho Bé Mi hôm nay.",
  "🌸 Đừng để áp lực làm Bé Mi mệt nhé.",
  "😆 Hãy vui lên vì hôm nay là một ngày đẹp trời.",
  "📚 Bé Mi ơi, cố gắng lên nhé.",
  "🌻 Hạnh phúc sẽ luôn ở bên Bé Mi.",
  "💐 Mong rằng hôm nay Bé Mi thật vui.",
  "☕ Cà phê sáng và một ngày thật đẹp nhé.",
  "💝 Bé Mi luôn đáng yêu.",
  "🌞 Ánh nắng hôm nay dành riêng cho Bé Mi.",
  "🌷 Hãy yêu thương bản thân nhiều hơn nhé.",
  "💖 Chúc Bé Mi luôn mỉm cười.",
  "🥰 Mọi điều tốt đẹp sẽ đến với Bé Mi.",
  "🌸 Hôm nay cũng phải thật vui nha.",
  "🎈 Bé Mi xứng đáng với mọi điều tốt đẹp.",
  "💪 Chúc Bé Mi luôn mạnh mẽ.",
  "🌻 Hôm nay hãy sống thật hạnh phúc nhé.",
  "☀️ Một ngày mới, thật nhiều niềm vui mới.",
  "💞 Bé Mi hôm nay chắc chắn sẽ thật tuyệt.",
  "🌹 Chúc Bé Mi có một ngày trọn vẹn.",
  "🌷 Bé Mi ơi, hôm nay cũng phải thật vui vẻ nhé.",
  "☀️ Chúc Bé Mi có một ngày dạy học thật nhiều niềm vui.",
  "💖 Một ngày mới lại đến, Bé Mi hãy luôn mỉm cười nha.",
  "📚 Hôm nay Bé Mi sẽ tiếp tục lan tỏa tri thức và yêu thương.",
  "🥰 Có người luôn mong Bé Mi được hạnh phúc mỗi ngày đó.",
  "🌸 Chúc Bé Mi luôn giữ được sự dịu dàng và nhiệt huyết.",
  "🍀 May mắn sẽ ghé thăm Bé Mi hôm nay.",
  "😆 Nếu học sinh quậy quá thì hãy cười thật tươi nha.",
  "💐 Chúc Bé Mi có thật nhiều tiếng cười.",
  "🌈 Hôm nay nhất định sẽ là một ngày đáng nhớ.",
  "☕ Bé Mi đã ăn sáng chưa nè?",
  "💝 Chúc Bé Mi luôn được yêu thương.",
  "🌻 Dù hôm nay có thế nào thì Bé Mi vẫn rất tuyệt.",
  "🎀 Bé Mi xinh đẹp thì phải luôn vui nha.",
  "💪 Chúc Bé Mi luôn mạnh mẽ và tự tin.",
  "🥳 Một ngày thật nhiều năng lượng nhé.",
  "🌹 Hãy luôn yêu thương bản thân nha Bé Mi.",
  "📖 Chúc Bé Mi có những tiết học thật thú vị.",
  "💞 Mong mọi điều tốt đẹp sẽ đến với Bé Mi.",
  "🌷 Bé Mi là cô giáo tuyệt vời nhất hôm nay.",
  "🍓 Chúc Bé Mi ngọt ngào như chính nụ cười của mình.",
  "🌞 Nắng đẹp rồi, Bé Mi cũng phải thật vui nhé.",
  "😚 Gửi Bé Mi một cái ôm thật ấm áp.",
  "✨ Hôm nay hãy thật tự tin nhé cô giáo.",
  "💖 Bé Mi luôn làm rất tốt rồi.",
  "🌸 Một ngày nhẹ nhàng và bình an nhé.",
  "🎈 Chúc Bé Mi có thật nhiều điều bất ngờ dễ thương.",
  "☀️ Bé Mi hôm nay phải cười thật nhiều nha.",
  "💌 Có người đang âm thầm cổ vũ Bé Mi đó.",
  "🌻 Chúc Bé Mi luôn rạng rỡ như ánh mặt trời.",
  "😄 Hãy để hôm nay trở thành một ngày thật đẹp nhé.",
  "📚 Bé Mi hôm nay chắc chắn sẽ truyền cảm hứng cho rất nhiều người.",
  "💪 Cố lên nha, Bé Mi giỏi lắm.",
  "🌈 Chúc Bé Mi gặp thật nhiều may mắn.",
  "🥰 Bé Mi xứng đáng với mọi điều tốt đẹp.",
  "🌹 Hôm nay hãy sống thật vui vẻ nhé.",
  "🍀 Một ngày an lành đang chờ Bé Mi.",
  "☕ Uống một ngụm cà phê và mỉm cười nào.",
  "💖 Bé Mi luôn đáng yêu như vậy đó.",
  "🌸 Dù bận đến đâu cũng nhớ nghỉ ngơi nhé.",
  "📖 Hôm nay Bé Mi sẽ có một ngày thật ý nghĩa.",
  "🎀 Chúc Bé Mi luôn giữ được niềm đam mê.",
  "🌷 Hạnh phúc luôn ở rất gần Bé Mi.",
  "😆 Đừng để áp lực làm Bé Mi mất đi nụ cười nha.",
  "💐 Chúc Bé Mi mọi việc suôn sẻ.",
  "🌞 Bé Mi chính là ánh nắng của hôm nay.",
  "💞 Một ngày mới với thật nhiều năng lượng tích cực.",
  "🥳 Chúc Bé Mi có thật nhiều tiếng cười.",
  "🌈 Hôm nay hãy thật yêu đời nhé.",
  "☀️ Bé Mi ơi, hãy luôn vui vẻ nha.",
  "💖 Chúc Bé Mi luôn mạnh khỏe.",
  "🌸 Mỗi ngày của Bé Mi đều thật đáng quý.",
  "🍓 Chúc Bé Mi có một ngày thật ngọt ngào.",
  "😚 Đừng quên uống đủ nước nhé.",
  "📚 Bé Mi sẽ có những tiết học thật tuyệt hôm nay.",
  "🌻 Luôn tự hào về chính mình nha Bé Mi.",
  "💪 Bé Mi mạnh mẽ hơn mình nghĩ rất nhiều.",
  "🎈 Hôm nay hãy tận hưởng từng khoảnh khắc.",
  "🌹 Chúc Bé Mi thật nhiều niềm vui.",
  "💌 Gửi Bé Mi một lời chúc bình an.",
  "☕ Chúc Bé Mi có một buổi sáng thật dễ chịu.",
  "🌷 Bé Mi hôm nay cũng phải thật hạnh phúc nhé.",
  "🥰 Nụ cười của Bé Mi làm ngày mới đẹp hơn rất nhiều.",
  "💖 Chúc Bé Mi có thật nhiều động lực.",
  "🌸 Mọi cố gắng của Bé Mi đều xứng đáng.",
  "🌞 Chúc Bé Mi luôn tràn đầy năng lượng.",
  "🍀 May mắn sẽ luôn đồng hành cùng Bé Mi.",
  "😄 Hôm nay hãy cười thật tươi nha.",
  "📖 Bé Mi là cô giáo rất tuyệt vời.",
  "💐 Chúc Bé Mi bình an suốt cả ngày.",
  "🌻 Hôm nay chắc chắn sẽ có điều tốt đẹp đến với Bé Mi.",
  "💪 Đừng lo lắng quá nhé, Bé Mi làm được mà.",
  "🎀 Bé Mi xứng đáng được yêu thương thật nhiều.",
  "🌈 Một ngày mới thật rực rỡ nhé.",
  "☀️ Chúc Bé Mi có một ngày thật nhẹ nhàng.",
  "💞 Hãy luôn là chính mình nhé Bé Mi.",
  "🥳 Chúc Bé Mi gặp nhiều niềm vui bất ngờ.",
  "🌷 Hôm nay cũng là một ngày tuyệt vời để mỉm cười.",
  "💖 Bé Mi luôn mang đến năng lượng tích cực.",
  "🍓 Chúc Bé Mi có một ngày thật dễ thương.",
  "🌸 Hãy giữ mãi sự lạc quan nhé.",
  "😆 Dù bận thế nào cũng phải vui nha.",
  "📚 Chúc Bé Mi lên lớp thật nhiều cảm hứng.",
  "🌻 Một ngày mới, một niềm vui mới.",
  "💐 Chúc Bé Mi luôn khỏe mạnh và yêu đời.",
  "☕ Bé Mi nhớ ăn uống đầy đủ nha.",
  "💝 Hôm nay cũng phải thật xinh đẹp nhé.",
  "🌞 Chúc Bé Mi có một ngày trọn vẹn.",
  "🌷 Bé Mi thật đáng yêu.",
  "💖 Chúc Bé Mi luôn gặp điều may mắn.",
  "🥰 Hôm nay hãy thật vui nhé.",
  "🌸 Một ngày bình yên dành cho Bé Mi.",
  "🎈 Chúc Bé Mi có thật nhiều tiếng cười.",
  "💪 Bé Mi luôn tuyệt vời.",
  "🌻 Hạnh phúc sẽ luôn mỉm cười với Bé Mi.",
  "☀️ Chúc Bé Mi ngày mới thật rạng rỡ.",
  "💞 Bé Mi hôm nay chắc chắn sẽ thật tuyệt.",
  "🌹 Mong mọi điều tốt đẹp sẽ đến với Bé Mi.",
  "🌷 Chúc Bé Mi hôm nay luôn vui vẻ và tràn đầy năng lượng.",
  "☀️ Một ngày mới thật rực rỡ đang chờ Bé Mi đó.",
  "💖 Bé Mi nhớ cười thật nhiều nhé.",
  "📚 Hôm nay Bé Mi sẽ lại truyền cảm hứng cho học sinh rồi.",
  "🥰 Chúc Bé Mi có một ngày ngập tràn yêu thương.",
  "🌸 Mọi điều tốt đẹp sẽ đến với Bé Mi hôm nay.",
  "🍀 Chúc Bé Mi gặp nhiều may mắn.",
  "😄 Bé Mi ơi, hôm nay hãy thật hạnh phúc nhé.",
  "💐 Mong rằng mọi việc đều suôn sẻ với Bé Mi.",
  "🌈 Một ngày đầy niềm vui đang đợi Bé Mi.",
  "☕ Bé Mi đã uống cà phê chưa nè?",
  "💌 Có người luôn mong Bé Mi được bình an.",
  "🌻 Chúc Bé Mi luôn giữ được sự nhiệt huyết.",
  "🎀 Hôm nay Bé Mi cũng phải thật xinh đẹp nhé.",
  "💪 Bé Mi giỏi lắm, hãy luôn tự tin nha.",
  "🥳 Chúc Bé Mi có thật nhiều tiếng cười.",
  "🌹 Hôm nay hãy yêu thương bản thân nhiều hơn nhé.",
  "📖 Mỗi bài giảng của Bé Mi đều rất tuyệt vời.",
  "💞 Bé Mi luôn là phiên bản tuyệt nhất của chính mình.",
  "🌷 Chúc Bé Mi một ngày thật nhẹ nhàng.",
  "🍓 Hôm nay hãy ngọt ngào như những quả dâu nhé.",
  "🌞 Bé Mi chính là ánh nắng của ngày hôm nay.",
  "😚 Gửi Bé Mi một cái ôm thật ấm áp.",
  "✨ Hôm nay chắc chắn sẽ là một ngày tuyệt vời.",
  "💖 Chúc Bé Mi luôn mạnh khỏe.",
  "🌸 Dù bận thế nào cũng nhớ nghỉ ngơi nhé.",
  "🎈 Một ngày đầy bất ngờ dễ thương nha.",
  "☀️ Bé Mi hãy luôn giữ nụ cười nhé.",
  "💌 Có người đang âm thầm cổ vũ Bé Mi đó.",
  "🌻 Chúc Bé Mi luôn tỏa sáng.",
  "😄 Hôm nay phải thật vui nha.",
  "📚 Bé Mi sẽ có một ngày dạy học thật ý nghĩa.",
  "💪 Không gì có thể làm khó Bé Mi đâu.",
  "🌈 Hãy tận hưởng ngày hôm nay nhé.",
  "🥰 Bé Mi xứng đáng với những điều tuyệt vời nhất.",
  "🌹 Hạnh phúc sẽ luôn ở bên Bé Mi.",
  "🍀 Chúc Bé Mi có một ngày bình an.",
  "☕ Một tách cà phê và một ngày thật đẹp nhé.",
  "💖 Bé Mi luôn rất đáng yêu.",
  "🌸 Hôm nay hãy thật yêu đời nha.",
  "📖 Chúc Bé Mi có thật nhiều cảm hứng.",
  "🎀 Bé Mi hôm nay chắc chắn sẽ thật tỏa sáng.",
  "🌷 Một ngày mới, một niềm vui mới.",
  "😆 Học sinh ngoan nhé, đừng làm cô Bé Mi đau đầu.",
  "💐 Chúc Bé Mi mọi việc thuận lợi.",
  "🌞 Ánh nắng hôm nay dành riêng cho Bé Mi.",
  "💞 Bé Mi hãy luôn giữ sự lạc quan nhé.",
  "🥳 Một ngày thật nhiều năng lượng nha.",
  "🌈 Hãy mỉm cười thật tươi nhé Bé Mi.",
  "☀️ Chúc Bé Mi luôn vui vẻ.",
  "💖 Bé Mi là cô giáo tuyệt vời nhất.",
  "🌸 Chúc Bé Mi luôn bình an.",
  "🍓 Hôm nay hãy thật ngọt ngào nhé.",
  "😚 Đừng quên uống nhiều nước nha.",
  "📚 Chúc Bé Mi có những tiết học thật vui.",
  "🌻 Bé Mi luôn mang đến năng lượng tích cực.",
  "💪 Cố lên nhé cô giáo đáng yêu.",
  "🎈 Hôm nay hãy làm điều khiến mình hạnh phúc.",
  "🌹 Chúc Bé Mi gặp nhiều điều tốt đẹp.",
  "💌 Có người luôn dõi theo và ủng hộ Bé Mi.",
  "☕ Chúc Bé Mi buổi sáng thật dễ chịu.",
  "🌷 Bé Mi hôm nay cũng phải thật vui nhé.",
  "🥰 Nụ cười của Bé Mi rất đẹp đó.",
  "💖 Hãy luôn tự hào về chính mình nhé.",
  "🌸 Bé Mi thật tuyệt vời.",
  "🌞 Một ngày mới tràn đầy hy vọng nhé.",
  "🍀 Chúc Bé Mi luôn may mắn.",
  "😄 Hôm nay hãy sống thật vui vẻ nha.",
  "📖 Bé Mi sẽ có thật nhiều niềm vui hôm nay.",
  "💐 Một ngày nhẹ nhàng và bình an nhé.",
  "🌻 Hôm nay chắc chắn sẽ là ngày tuyệt vời.",
  "💪 Bé Mi mạnh mẽ hơn mình nghĩ rất nhiều.",
  "🎀 Chúc Bé Mi luôn được yêu thương.",
  "🌈 Hôm nay hãy thật rạng rỡ nhé.",
  "☀️ Chúc Bé Mi có thật nhiều năng lượng.",
  "💞 Bé Mi luôn đáng quý.",
  "🥳 Hãy tận hưởng từng khoảnh khắc nhé.",
  "🌷 Một ngày thật dễ thương dành cho Bé Mi.",
  "💖 Bé Mi hãy luôn giữ nụ cười.",
  "🍓 Chúc Bé Mi thật ngọt ngào.",
  "🌸 Hôm nay đừng để áp lực làm mình buồn nhé.",
  "😆 Bé Mi cười lên nào.",
  "📚 Chúc Bé Mi có nhiều cảm hứng khi dạy học.",
  "🌻 Hôm nay hãy thật yêu đời.",
  "💐 Chúc Bé Mi sức khỏe dồi dào.",
  "☕ Uống cà phê rồi bắt đầu ngày mới thôi nào.",
  "💝 Bé Mi luôn đặc biệt.",
  "🌞 Hôm nay nhất định sẽ có điều tốt đẹp.",
  "🌷 Chúc Bé Mi luôn hạnh phúc.",
  "💖 Một ngày an lành nhé Bé Mi.",
  "🥰 Hãy luôn là chính mình nhé.",
  "🌸 Bé Mi hôm nay cũng thật đáng yêu.",
  "🎈 Chúc Bé Mi có thật nhiều tiếng cười.",
  "💪 Cố lên nhé, Bé Mi!",
  "🌻 Hạnh phúc sẽ luôn bên Bé Mi.",
  "☀️ Chúc Bé Mi ngày mới thật rạng rỡ.",
  "💞 Bé Mi xứng đáng với mọi điều tốt đẹp.",
  "🌹 Mong hôm nay Bé Mi sẽ thật vui.",
  "🥰 Có người luôn mong Bé Mi mỉm cười mỗi ngày.",
  "🌷 Chúc Bé Mi một ngày trọn vẹn và hạnh phúc.",
];
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/splash-messages.ts
git commit -m "feat: add daily splash message pool (500 Vietnamese motivational messages)"
```

- [ ] **Step 3: Manual verify**

Run `yarn dev`, then in a browser console:
```js
(await import('/src/lib/splash-messages.ts')) // should not error
```
Or simply check that the server compiles without TypeScript errors in the terminal output.

---

### Task 2: DailySplash component

**Files:**
- Create: `src/components/layout/DailySplash.tsx`

**Interfaces:**
- Consumes: `SPLASH_MESSAGES` from `src/lib/splash-messages.ts`
- Consumes: `useIsMobile` from `src/hooks/use-is-mobile`
- Produces: `export default function DailySplash()` — renders `null` when already shown today, otherwise renders fullscreen overlay; no props

- [ ] **Step 1: Create `src/components/layout/DailySplash.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import useIsMobile from "@/hooks/use-is-mobile";
import { SPLASH_MESSAGES } from "@/lib/splash-messages";

const STORAGE_KEY = "myclass_splash_date";

function todayVNKey(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
}

const EMOJIS = ["🌸", "💖", "✨", "🌷", "🍀", "🌺", "💐", "⭐", "🌟", "💕"];

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  emoji: EMOJIS[i % EMOJIS.length],
  left: `${5 + ((i * 537) % 85)}%`,
  fontSize: `${16 + (i * 3) % 14}px`,
  duration: `${6 + (i * 7) % 6}s`,
  delay: `${((i * 4) % 40) / 10}s`,
}));

export default function DailySplash() {
  const [show, setShow] = useState<boolean | null>(null);
  const [exiting, setExiting] = useState(false);
  const [typed, setTyped] = useState("");
  const [buttonVisible, setButtonVisible] = useState(false);
  const messageRef = useRef("");
  const cardRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // SSR guard + daily check
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === todayVNKey()) {
        setShow(false);
        return;
      }
      messageRef.current =
        SPLASH_MESSAGES[Math.floor(Math.random() * SPLASH_MESSAGES.length)];
      setShow(true);
    } catch {
      setShow(false);
    }
  }, []);

  // Typewriter
  useEffect(() => {
    if (!show) return;
    const chars = [...messageRef.current];
    let i = 0;
    let ticker: ReturnType<typeof setTimeout>;

    const startTimeout = setTimeout(() => {
      const tick = () => {
        if (i >= chars.length) {
          setTimeout(() => setButtonVisible(true), 300);
          return;
        }
        setTyped(chars.slice(0, i + 1).join(""));
        i++;
        ticker = setTimeout(tick, 35);
      };
      tick();
    }, 400);

    return () => {
      clearTimeout(startTimeout);
      clearTimeout(ticker);
    };
  }, [show]);

  // 3D tilt — desktop mouse
  useEffect(() => {
    if (!show || isMobile) return;
    const onMouseMove = (e: MouseEvent) => {
      const card = cardRef.current;
      if (!card) return;
      const rx =
        ((e.clientY - window.innerHeight / 2) / (window.innerHeight / 2)) * -12;
      const ry =
        ((e.clientX - window.innerWidth / 2) / (window.innerWidth / 2)) * 12;
      card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    };
    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, [show, isMobile]);

  // 3D tilt — mobile gyroscope (breathing CSS is fallback; gyro disables it on first event)
  useEffect(() => {
    if (!show || !isMobile) return;
    const onOrientation = (e: DeviceOrientationEvent) => {
      const card = cardRef.current;
      if (!card || e.beta === null || e.gamma === null) return;
      if (card.style.animationName !== "none") {
        card.style.animation = "none";
      }
      const rx = Math.max(-12, Math.min(12, (e.beta - 45) / 4));
      const ry = Math.max(-12, Math.min(12, e.gamma / 4));
      card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    };
    window.addEventListener("deviceorientation", onOrientation);
    return () => window.removeEventListener("deviceorientation", onOrientation);
  }, [show, isMobile]);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, todayVNKey());
    } catch {}
    setExiting(true);
    setTimeout(() => setShow(false), 400);
  };

  if (show === null || !show) return null;

  const bgUrl = isMobile ? "/bg-mobile.png" : "/bg-main.png";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: `url('${bgUrl}') center/cover fixed no-repeat`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: exiting
          ? "splashExit 0.4s ease-in forwards"
          : "splashEnter 0.5s ease-out forwards",
      }}
    >
      {/* Floating particles */}
      {PARTICLES.map((p) => (
        <span
          key={p.id}
          aria-hidden
          style={{
            position: "absolute",
            left: p.left,
            bottom: "-40px",
            fontSize: p.fontSize,
            animation: `floatUp ${p.duration} ${p.delay} ease-in infinite`,
            pointerEvents: "none",
            userSelect: "none",
            lineHeight: 1,
          }}
        >
          {p.emoji}
        </span>
      ))}

      {/* 3D card */}
      <div
        ref={cardRef}
        style={{
          position: "relative",
          maxWidth: "520px",
          width: "calc(100% - 48px)",
          padding: "32px",
          background: "rgba(255,255,255,0.18)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.35)",
          borderRadius: "24px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          animation: isMobile ? "breathe 3s ease-in-out infinite" : undefined,
          transition: "transform 0.1s ease-out",
          maxHeight: "70dvh",
          overflowY: "auto",
        }}
      >
        {/* Shimmer overlay */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "24px",
            background:
              "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 3s linear infinite",
            pointerEvents: "none",
          }}
        />

        {/* Message text */}
        <p
          style={{
            fontSize: isMobile ? "18px" : "22px",
            fontWeight: 600,
            color: "white",
            textShadow: "0 1px 8px rgba(0,0,0,0.3)",
            textAlign: "center",
            lineHeight: 1.6,
            margin: 0,
            minHeight: "2em",
            position: "relative",
            zIndex: 1,
          }}
        >
          {typed}
          {!buttonVisible && (
            <span
              aria-hidden
              style={{ opacity: 0.7, animation: "blink 0.8s step-end infinite" }}
            >
              |
            </span>
          )}
        </p>

        {/* Dismiss button */}
        {buttonVisible && (
          <div
            style={{
              textAlign: "center",
              marginTop: "28px",
              position: "relative",
              zIndex: 1,
            }}
          >
            <button
              onClick={dismiss}
              style={{
                background: "#E8788A",
                color: "white",
                border: "none",
                borderRadius: "50px",
                padding: "12px 32px",
                fontSize: "15px",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(232,120,138,0.4)",
                animation: "fadeInBtn 0.6s ease-out forwards",
              }}
            >
              Bắt đầu ngày mới 🌸
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes splashEnter {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes splashExit {
          from { opacity: 1; }
          to   { opacity: 0; transform: scale(1.03); }
        }
        @keyframes floatUp {
          0%   { transform: translateY(0) rotate(0deg);    opacity: 0.9; }
          80%  { opacity: 0.5; }
          100% { transform: translateY(-110vh) rotate(20deg); opacity: 0; }
        }
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        @keyframes breathe {
          0%, 100% { transform: perspective(800px) scale(1);     }
          50%       { transform: perspective(800px) scale(1.015); }
        }
        @keyframes fadeInBtn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        @keyframes blink {
          0%, 100% { opacity: 0.7; }
          50%       { opacity: 0;   }
        }
      `}</style>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/DailySplash.tsx
git commit -m "feat: add DailySplash component with 3D effects and typewriter animation"
```

- [ ] **Step 3: Manual verify (before wiring to layout)**

In browser console on any dashboard page, paste:
```js
localStorage.removeItem("myclass_splash_date");
```
Then reload. The splash won't appear yet (not wired) — this just confirms the key clears correctly. Proceed to Task 3.

---

### Task 3: Wire to dashboard layout

**Files:**
- Modify: `src/app/(dashboard)/layout.tsx`

**Interfaces:**
- Consumes: `DailySplash` default export from `src/components/layout/DailySplash`

- [ ] **Step 1: Add `DailySplash` to the dashboard layout**

Open `src/app/(dashboard)/layout.tsx`. The current file content is:

```tsx
import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/signin");

  return (
    <div className="flex h-[100dvh]">
      <Sidebar user={session.user} />
      <main className="flex-1 overflow-hidden pb-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom))] md:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
```

Replace with:

```tsx
import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import DailySplash from "@/components/layout/DailySplash";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/signin");

  return (
    <div className="flex h-[100dvh]">
      <DailySplash />
      <Sidebar user={session.user} />
      <main className="flex-1 overflow-hidden pb-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom))] md:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(dashboard)/layout.tsx
git commit -m "feat: show DailySplash on first dashboard visit each day"
```

- [ ] **Step 3: Full manual verification**

Start the dev server: `yarn dev`

**Test A — First visit today (splash should appear):**
1. Open browser devtools → Application → Local Storage → delete key `myclass_splash_date`
2. Navigate to `http://localhost:3000` (or any dashboard route)
3. Expected: fullscreen splash appears over everything (sidebar, nav, header all hidden under it)
4. Expected: emoji particles float upward from bottom
5. Expected: text types out character by character starting ~400ms after mount
6. Expected: blinking cursor `|` visible while typing
7. Expected: "Bắt đầu ngày mới 🌸" button appears after text finishes
8. Expected: on desktop, moving mouse causes card to tilt in 3D
9. Tap/click the button → splash fades out and scales slightly → dashboard content appears

**Test B — localStorage written after dismiss:**
1. After completing Test A, check devtools → Local Storage
2. Expected: `myclass_splash_date` key exists with today's date in `YYYY-MM-DD` format (VN timezone)

**Test C — No repeat same day:**
1. Refresh the page (or navigate away and back)
2. Expected: splash does NOT appear again — dashboard loads immediately

**Test D — Mobile (use devtools device emulation, 375px width):**
1. Clear `myclass_splash_date`, reload
2. Expected: background shows `bg-mobile.png`, text is 18px
3. Expected: card has gentle breathing animation (scale up/down)
4. Expected: button visible and tappable after text finishes

**Test E — Navigate to a bookmarked deep route:**
1. Clear `myclass_splash_date`
2. Navigate directly to `http://localhost:3000/students`
3. Expected: splash appears on this route too (dashboard layout wraps all routes)
