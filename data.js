/* ============================================================
   飞花音 · 数据层  (lyric bank / songs / players / personas ...)
   所有题目与玩家均为演示用模拟数据
   ============================================================ */

/* 曲库：每个「令字」下挂着可被判定的歌词条目
   hit = 需要在歌词中高亮的命中片段
   m   = 判定模式: literal(字面对) / semantic(AI 语义理解) */
const BANK = {
  "月": [
    { l:"明月几时有 把酒问青天", s:"但愿人长久", a:"王菲", hit:"明月", m:"literal" },
    { l:"城里的月光 把梦照亮", s:"城里的月光", a:"许美静", hit:"月光", m:"literal" },
    { l:"我在仰望 月亮之上", s:"月亮之上", a:"凤凰传奇", hit:"月亮", m:"literal" },
    { l:"看月亮爬上来", s:"看月亮爬上来", a:"许嵩", hit:"月亮", m:"literal" },
    { l:"床前明月光 疑是地上霜", s:"床前明月光", a:"梅艳芳", hit:"明月", m:"literal" },
    { l:"白月光 照天涯的两端", s:"白月光", a:"张信哲", hit:"月光", m:"literal" },
    { l:"月光色 女子香", s:"月光", a:"胡彦斌", hit:"月光", m:"literal" },
    { l:"月半弯 月半弯", s:"月半弯", a:"陈坤", hit:"月", m:"literal" }
  ],
  "雨": [
    { l:"雨一直下 气氛不算融洽", s:"雨一直下", a:"张宇", hit:"雨", m:"literal" },
    { l:"我听见雨滴落在青青草地", s:"小幸运", a:"田馥甄", hit:"雨滴", m:"literal" },
    { l:"但偏偏雨渐渐大到我看你不见", s:"晴天", a:"周杰伦", hit:"雨", m:"literal" },
    { l:"下雨天了怎么办 我好想你", s:"下雨天", a:"南拳妈妈", hit:"雨", m:"literal" },
    { l:"蓝色雨已经远离", s:"蓝色雨", a:"庾澄庆", hit:"雨", m:"literal" },
    { l:"在雨中 看见你的身影", s:"在雨中", a:"汪峰", hit:"雨", m:"literal" },
    { l:"我听见下雨的声音", s:"听见下雨的声音", a:"周杰伦", hit:"下雨", m:"literal" }
  ],
  "风": [
    { l:"谁在用琵琶弹奏一曲东风破", s:"东风破", a:"周杰伦", hit:"东风", m:"literal" },
    { l:"晚风吹起你鬓间的白发", s:"起风了", a:"买辣椒也用券", hit:"风", m:"literal" },
    { l:"凉风轻轻吹到 俏然进了我衣襟", s:"风的季节", a:"徐小凤", hit:"风", m:"literal" },
    { l:"风继续吹 不忍远离", s:"风继续吹", a:"张国荣", hit:"风", m:"literal" },
    { l:"风雨中抱紧自由", s:"光辉岁月", a:"Beyond", hit:"风", m:"literal" },
    { l:"大风吹 大风吹", s:"大风吹", a:"王赫野 / 刘惜君", hit:"风", m:"literal" },
    { l:"风一样的男子 来去无踪", s:"风一样的男子", a:"陈晓东", hit:"风", m:"literal" }
  ],
  "夜": [
    { l:"夜空中最亮的星 能否听清", s:"夜空中最亮的星", a:"逃跑计划", hit:"夜", m:"literal" },
    { l:"为你弹奏肖邦的夜曲", s:"夜曲", a:"周杰伦", hit:"夜", m:"literal" },
    { l:"夜夜夜夜 我不想睡", s:"夜夜夜夜", a:"齐秦", hit:"夜", m:"literal" },
    { l:"夜上海 夜上海 你是个不夜城", s:"夜上海", a:"周璇", hit:"夜", m:"literal" },
    { l:"夜太黑 不敢在你面前沉醉", s:"夜太黑", a:"林忆莲", hit:"夜", m:"literal" },
    { l:"1983年小巷 12月晴朗 夜的第七章", s:"夜的第七章", a:"周杰伦", hit:"夜", m:"literal" }
  ],
  "花": [
    { l:"菊花残 满地伤 你的笑容已泛黄", s:"菊花台", a:"周杰伦", hit:"花", m:"literal" },
    { l:"静止了 所有的花开", s:"花海", a:"周杰伦", hit:"花", m:"literal" },
    { l:"雾里看花 水中望月", s:"雾里看花", a:"那英", hit:"花", m:"literal" },
    { l:"花田里犯了错", s:"花田错", a:"王力宏", hit:"花", m:"literal" },
    { l:"栀子花开呀开", s:"栀子花开", a:"何炅", hit:"花", m:"literal" },
    { l:"故事的小黄花 从出生那年就飘着", s:"晴天", a:"周杰伦", hit:"花", m:"literal" }
  ],
  "酒": [
    { l:"酒干倘卖无", s:"酒干倘卖无", a:"苏芮", hit:"酒", m:"literal" },
    { l:"喝一壶老酒 让我回回头", s:"一壶老酒", a:"陆树铭", hit:"酒", m:"literal" },
    { l:"对酒当歌 人生几何", s:"短歌行", a:"群星", hit:"酒", m:"literal" },
    { l:"葡萄美酒夜光杯", s:"凉州词", a:"群星", hit:"酒", m:"literal" },
    { l:"把酒问青天 明月几时有", s:"但愿人长久", a:"王菲", hit:"酒", m:"literal" }
  ],
  "山": [
    { l:"我曾经跨过山和大海", s:"平凡之路", a:"朴树", hit:"山", m:"literal" },
    { l:"越过山丘 虽然已白了头", s:"山丘", a:"李宗盛", hit:"山", m:"literal" },
    { l:"山上的野花为谁开又为谁败", s:"野花", a:"田震", hit:"山", m:"literal" },
    { l:"这里的山路十八弯", s:"山路十八弯", a:"李琼", hit:"山", m:"literal" }
  ],
  "水": [
    { l:"雾里看花 水中望月", s:"雾里看花", a:"那英", hit:"水", m:"literal" },
    { l:"抽刀断水水更流", s:"宣州谢脁楼饯别校书叔云", a:"群星", hit:"水", m:"literal" },
    { l:"山青水秀太阳高", s:"山青水秀", a:"群星", hit:"水", m:"literal" },
    { l:"水中的花朵", s:"水中花", a:"群星", hit:"水", m:"literal" }
  ],
  "梦": [
    { l:"我的未来不是梦", s:"我的未来不是梦", a:"张雨生", hit:"梦", m:"literal" },
    { l:"我们都是追梦人", s:"我们都是追梦人", a:"群星", hit:"梦", m:"literal" },
    { l:"梦一场 爱一场", s:"梦一场", a:"那英", hit:"梦", m:"literal" },
    { l:"梦里花落知多少", s:"梦里花落知多少", a:"群星", hit:"梦", m:"literal" }
  ],
  "天": [
    { l:"天青色等烟雨 而我在等你", s:"青花瓷", a:"周杰伦", hit:"天", m:"literal" },
    { l:"天亮了", s:"天亮了", a:"韩红", hit:"天", m:"literal" },
    { l:"蓝天白云 青山绿水", s:"草原上升起不落的太阳", a:"群星", hit:"天", m:"literal" }
  ],
  "心": [
    { l:"轻轻地一个吻 已经打动我的心", s:"月亮代表我的心", a:"邓丽君", hit:"心", m:"literal" },
    { l:"我总是心太软 心太软", s:"心太软", a:"任贤齐", hit:"心", m:"literal" },
    { l:"心若在 梦就在", s:"从头再来", a:"刘欢", hit:"心", m:"literal" }
  ],
  "人": [
    { l:"确认过眼神 我遇上对的人", s:"醉赤壁", a:"林俊杰", hit:"人", m:"literal" },
    { l:"人潮人海中 有你有我", s:"无地自容", a:"黑豹乐队", hit:"人", m:"literal" },
    { l:"你我皆凡人 生在人世间", s:"凡人歌", a:"李宗盛", hit:"人", m:"literal" }
  ],
  "云": [
    { l:"风中有朵雨做的云", s:"风中有朵雨做的云", a:"孟庭苇", hit:"云", m:"literal" },
    { l:"蓝蓝的天上白云飘", s:"草原上升起不落的太阳", a:"群星", hit:"云", m:"literal" },
    { l:"云在飞 心在追", s:"云在飞", a:"群星", hit:"云", m:"literal" }
  ],
  "雪": [
    { l:"2002年的第一场雪", s:"2002年的第一场雪", a:"刀郎", hit:"雪", m:"literal" },
    { l:"你在南方的艳阳里大雪纷飞", s:"南山南", a:"马頔", hit:"雪", m:"literal" },
    { l:"雪花飘飘 北风萧萧 天地一片苍茫", s:"一剪梅", a:"费玉清", hit:"雪花", m:"literal" }
  ],
  "春": [
    { l:"春天在哪里呀 春天在哪里", s:"春天在哪里", a:"群星", hit:"春", m:"literal" },
    { l:"春风十里不如你", s:"春风十里", a:"鹿先森乐队", hit:"春", m:"literal" },
    { l:"春天花会开 鸟儿自由自在", s:"春天花会开", a:"任贤齐", hit:"春", m:"literal" }
  ],
  /* ---- Lv2 组合飞花令 ---- */
  "明月": [
    { l:"明月几时有 把酒问青天", s:"但愿人长久", a:"王菲", hit:"明月", m:"literal" },
    { l:"床前明月光 疑是地上霜", s:"床前明月光", a:"梅艳芳", hit:"明月", m:"literal" },
    { l:"举头望明月 低头思故乡", s:"静夜思", a:"群星", hit:"明月", m:"literal" }
  ],
  "东风": [
    { l:"谁在用琵琶弹奏一曲东风破", s:"东风破", a:"周杰伦", hit:"东风", m:"literal" },
    { l:"东风夜放花千树", s:"青玉案·元夕", a:"群星", hit:"东风", m:"literal" }
  ],
  "千里": [
    { l:"千里之外 你无声黑白", s:"千里之外", a:"周杰伦 / 费玉清", hit:"千里", m:"literal" },
    { l:"千里冰封 万里雪飘", s:"沁园春·雪", a:"群星", hit:"千里", m:"literal" }
  ],
  "黄花": [
    { l:"故事的小黄花 从出生那年就飘着", s:"晴天", a:"周杰伦", hit:"黄花", m:"literal" },
    { l:"人比黄花瘦", s:"醉花阴", a:"群星", hit:"黄花", m:"literal" }
  ],
  "桃花": [
    { l:"桃花朵朵开 开呀开", s:"桃花朵朵开", a:"阿牛", hit:"桃花", m:"literal" },
    { l:"去年今日此门中 人面桃花相映红", s:"题都城南庄", a:"群星", hit:"桃花", m:"literal" }
  ],
  "天地": [
    { l:"天地悠悠 过客匆匆 潮起又潮落", s:"潇洒走一回", a:"叶蒨文", hit:"天地", m:"literal" },
    { l:"天地之间 有你有我", s:"天地有情", a:"群星", hit:"天地", m:"literal" }
  ],
  /* ---- Lv3 主题飞花令 (AI 语义) ---- */
  "少年": [
    { l:"我还是从前那个少年 没有一丝丝改变", s:"少年", a:"梦然", hit:"少年", m:"literal" },
    { l:"愿你出走半生 归来仍是少年", s:"少年", a:"群星", hit:"少年", m:"semantic" },
    { l:"曾梦想仗剑走天涯 看一看世界的繁华", s:"曾经的你", a:"许巍", hit:"梦想 / 闯荡的年纪", m:"semantic" }
  ],
  "风雪": [
    { l:"雪花飘飘 北风萧萧 天地一片苍茫", s:"一剪梅", a:"费玉清", hit:"风雪", m:"semantic" },
    { l:"2002年的第一场雪 比以往时候来的更晚一些", s:"2002年的第一场雪", a:"刀郎", hit:"风雪", m:"semantic" },
    { l:"寒风萧萧 飞雪飘零", s:"雪中情", a:"群星", hit:"风雪", m:"semantic" }
  ],
  "丹心": [
    { l:"人生自古谁无死 留取丹心照汗青", s:"过零丁洋", a:"文天祥 / 群星", hit:"丹心", m:"literal" },
    { l:"精忠报国 满腔热血", s:"精忠报国", a:"屠洪刚", hit:"丹心 / 报国", m:"semantic" }
  ],
  "何人": [
    { l:"不知天上宫阙 今夕是何年", s:"但愿人长久", a:"王菲", hit:"何人 / 何年", m:"semantic" },
    { l:"问君能有几多愁 恰似一江春水向东流", s:"虞美人", a:"群星", hit:"何人 / 何愁", m:"semantic" }
  ],
  "故乡": [
    { l:"举头望明月 低头思故乡", s:"静夜思", a:"群星", hit:"故乡", m:"literal" },
    { l:"故乡的云 故乡的风", s:"故乡的云", a:"费翔", hit:"故乡", m:"literal" },
    { l:"少小离家老大回 乡音无改鬓毛衰", s:"回乡偶书", a:"群星", hit:"思乡", m:"semantic" }
  ],
  "职业": [
    { l:"我是一个粉刷匠 粉刷本领强", s:"粉刷匠", a:"群星", hit:"粉刷匠", m:"semantic" },
    { l:"咱们工人有力量 嘿 咱们工人有力量", s:"咱们工人有力量", a:"群星", hit:"工人", m:"semantic" },
    { l:"长大后我就成了你 才知道那间教室", s:"长大后我就成了你", a:"宋祖英", hit:"教师", m:"semantic" }
  ],
  /* ---- Lv4 超级飞花令 ---- */
  "孤独": [
    { l:"狂欢是一群人的孤单", s:"叶子", a:"阿桑", hit:"孤单 / 孤独", m:"semantic" },
    { l:"我一个人的失眠 一个人的空间", s:"一个人的失眠", a:"群星", hit:"一个人", m:"semantic" },
    { l:"寂寞寂寞就好", s:"寂寞寂寞就好", a:"田馥甄", hit:"寂寞", m:"semantic" }
  ],
  "暗恋": [
    { l:"你存在我深深的脑海里", s:"我的歌声里", a:"曲婉婷", hit:"藏不住的心事", m:"semantic" },
    { l:"我在你看不见的地方 偷偷喜欢", s:"暗恋", a:"群星", hit:"暗恋", m:"literal" },
    { l:"我喜欢你 是我独家的记忆", s:"独家记忆", a:"陈小春", hit:"暗恋", m:"semantic" }
  ],
  "数字+颜色": [
    { l:"一件黑色毛衣 两个人的回忆", s:"黑色毛衣", a:"周杰伦", hit:"一件·黑色", m:"semantic" },
    { l:"两只老虎 两只老虎", s:"两只老虎", a:"群星", hit:"两只", m:"semantic" },
    { l:"红色高跟鞋 蓝色百褶裙", s:"红色高跟鞋", a:"蔡健雅", hit:"红色·蓝色", m:"semantic" }
  ],
  "成语": [
    { l:"相见不如怀念", s:"相见不如怀念", a:"那英", hit:"相见不如怀念", m:"semantic" },
    { l:"一见钟情 两情相悦", s:"一见钟情", a:"群星", hit:"一见钟情", m:"semantic" },
    { l:"念念不忘 必有回响", s:"念念不忘", a:"群星", hit:"念念不忘", m:"semantic" }
  ]
};

/* 类型 → 题库字池 */
const WORD_POOL = {
  single: ["月","雨","风","夜","花","酒","山","水","梦","天","心","人","云","雪","春"],
  combo:  ["明月","东风","千里","黄花","桃花","天地"],
  theme:  ["少年","风雪","丹心","何人","故乡","职业"],
  super:  ["孤独","暗恋","数字+颜色","成语"]
};

const TYPE_META = {
  single: { name:"单字飞花令", lv:"Lv1", desc:"字面含该字即算对", icon:"一" },
  combo:  { name:"组合飞花令", lv:"Lv2", desc:"含该词或近义表达即算对", icon:"双" },
  theme:  { name:"主题飞花令", lv:"Lv3", desc:"AI 语义理解，扣题即算对", icon:"意" },
  super:  { name:"超级飞花令", lv:"Lv4", desc:"AI 理解情绪意境或双限定", icon:"极" }
};

/* 玩法开关 */
const GAMEPLAYS = {
  standard: { name:"标准接力", desc:"轮流唱含关键字的歌词，接不上者负", fun:"基础竞技" },
  bomb:     { name:"炸弹歌对决", desc:"各秘密设一首含字的歌为炸弹，唱到对方炸弹立刻引爆失败", fun:"心理博弈、踩雷爆笑" },
  ban:      { name:"反向飞花令（禁字）", desc:"指定一个禁字，谁唱出来谁输", fun:"越日常的字越难躲" },
  multi:    { name:"多语言关键词", desc:"支持英文 / 粤语 / 日语 / 韩语关键词", fun:"唱欧美、粤语歌也能玩" },
  tone:     { name:"声调飞花令（彩蛋）", desc:"给一个关键音，按四个声调各唱一句", fun:"音乐独有，新鲜有挑战" },
  tail:     { name:"尾字接龙", desc:"上一句尾字接下一句首字，可设不许谐音", fun:"最经典的歌曲接龙" }
};

/* 快速开局预设档 */
const PRESETS = {
  newbie:  { name:"新手", type:"single", play:"standard", desc:"单字飞花令 + 标准接力，人人接得上" },
  joyful:  { name:"欢乐", type:"single", play:"bomb", desc:"单字飞花令 + 炸弹歌，容易踩雷，节目效果强" },
  hardcore:{ name:"硬核", type:"theme", play:"standard", desc:"主题/超级飞花令 + 任意玩法，地狱心理战" }
};

/* 曲库偏好 */
const LIB_PREFS = {
  lang:  ["普通话","粤语","英语","日语","韩语"],
  era:   ["80s","90s","00s","10s","2020s 新歌"],
  genre: ["流行","摇滚","民谣","说唱","古风"],
  singer:["周杰伦","王菲","Beyond","邓丽君","林俊杰","许嵩"]
};

/* 技能卡 */
const SKILL_CARDS = [
  { id:"ban",   name:"禁句卡", sym:"禁", desc:"本轮指定一首歌，谁都不能唱", why:"有人忍不住唱了直接出局，搞笑" },
  { id:"help",  name:"求救卡", sym:"救", desc:"接不上可指定一名队友帮唱，一起得分", why:"猪队友和神队友名场面" },
  { id:"skip",  name:"跳过卡", sym:"跳", desc:"直接跳过这一轮，但扣 1 分", why:"苟活策略" },
  { id:"double",name:"双倍卡", sym:"双", desc:"本轮唱指定类型（粤语 / rap / 古风）得双倍分", why:"逼整活，全场笑翻" },
  { id:"reverse",name:"反转卡",sym:"逆", desc:"上一轮唱错的人，可指定下一个谁来接", why:"复仇机制" }
];

/* AI 人设（人机练习） */
const PERSONAS = {
  gentle: { name:"温柔学长", tag:"治愈担当", line:"别急，我陪你慢慢想 ~",
            praise:["这一句太好听了，给你点个赞！","哇，这个角度我怎么没想到 /"], tease:["差一点点，关键词再找准就好啦","时间还够，深呼吸，下一句一定行"] },
  sharp:  { name:"毒舌乐评人", tag:"人间清醒", line:"就这？我洗耳恭听。",
            praise:["勉强及格，算你有点品味。","行吧，这句还算像样。"], tease:["跑调了兄弟，关键字都没唱进去。","这也叫接歌？我替你尴尬。"] }
};

/* 对手人设（实时房间 NPC 补位） */
const NPC_NAMES = ["阿令","墨白","小狐","清商","拾光","南风","知野","砚青"];

/* 称号 */
const TITLES = ["初入乐林","听风客","衔月生","咏歌人","令主","诗仙"];

/* 排行榜 */
const RANKING = [
  { n:"夜空中最亮的星", c:"月", v:12860, by:"砚青" },
  { n:"雨一直下", c:"雨", v:11240, by:"小狐" },
  { n:"起风了", c:"风", v:10980, by:"南风" },
  { n:"月亮之上", c:"月", v:9740, by:"知野" },
  { n:"光辉岁月", c:"风", v:9110, by:"墨白" }
];

/* 社群 */
const GROUPS = [
  { n:"月下接歌·常驻群", m:328, d:"每晚 20:00 定时飞花令", tag:"91 天连打" },
  { n:"粤语飞花令专线", m:157, d:"想唱 Beyond / 张国荣就来", tag:"粤语链" },
  { n:"宿舍开黑小分队", m:46, d:"4 人开局，人满就玩", tag:"熟人局" }
];

/* ============================================================
   真实原唱片段 · Apple Music 官方 30 秒试听（直连 CDN，无需 CORS）
   逐首验证可播放；未收录的歌曲自动回退到「合成试听」
   ============================================================ */
/* ============================================================
   真实原唱片段 · 官方音乐库 30 秒试听（直连 CDN，无需 CORS）
   逐首验证可播放；未收录的歌曲自动回退为「合成伴奏」（纯旋律，不朗读）
   ============================================================ */
/* ============================================================
   真实原唱片段 · 官方音乐库 30 秒试听（直连 CDN，无需 CORS）
   逐首验证可播放；未收录的歌曲自动回退为「合成伴奏」（纯旋律，不朗读）
   ============================================================ */
const MUSIC = {
  "城里的月光": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/c2/68/20/c26820a5-45b2-67e2-1645-53afdfbd58ac/mzaf_3503597938388484198.plus.aac.p.m4a", a:"Mavis Hee, Silence Wang, Tracy Wang & Julius" },
  "月亮之上": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/b1/fb/0b/b1fb0b79-6e2f-07ad-ec8c-c015573c96f7/mzaf_15480878697614126301.plus.aac.p.m4a", a:"鳳凰傳奇" },
  "床前明月光": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/d2/6a/70/d26a70c9-85f7-e6a6-4f0c-d36f6cb61027/mzaf_17683916380733091342.plus.aac.p.m4a", a:"梅艷芳" },
  "白月光": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/d3/90/38/d39038ea-882e-9ace-0fb9-5a467b572ff0/mzaf_12377251222983407817.plus.aac.p.m4a", a:"張信哲" },
  "月光": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/f5/c7/9d/f5c79d19-453d-2a28-a69e-3c6273eb8f16/mzaf_3847132253457870150.plus.aac.p.m4a", a:"胡彥斌" },
  "月半弯": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview122/v4/9a/e1/ea/9ae1ea76-0c3e-a8f0-7028-abec94111a60/mzaf_3389303364576974384.plus.aac.p.m4a", a:"张濛" },
  "雨一直下": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/8e/4c/0a/8e4c0a4e-2f08-a7ce-a3fb-46684430afd6/mzaf_1775733204959087990.plus.aac.p.m4a", a:"張宇" },
  "小幸运": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/db/a0/cb/dba0cbff-44e9-3ee2-f706-d5f2584d64de/mzaf_17342827616158514743.plus.aac.p.m4a", a:"Jieyi Lin" },
  "晴天": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/20/d0/e7/20d0e7db-9c12-795a-d738-2fc3dde4ac9a/mzaf_10317517925583301645.plus.aac.p.m4a", a:"周杰倫" },
  "下雨天": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/e2/f3/a3/e2f3a33f-fdaf-c21b-1314-ede2a3d5e2a8/mzaf_5522171123800983062.plus.aac.p.m4a", a:"南拳媽媽" },
  "在雨中": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/76/ae/f7/76aef739-2f14-2d3e-bd04-feb9a7404a69/mzaf_414644436958310779.plus.aac.p.m4a", a:"汪峯" },
  "听见下雨的声音": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/6b/69/2e/6b692e6c-e592-02bc-7b94-1bd14a35c9e0/mzaf_16570866088064887722.plus.aac.p.m4a", a:"Jay Chou, Joanna Dong & 卓猷燕" },
  "起风了": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/e1/d4/b7/e1d4b718-d0ae-6f0c-e9f7-94dea41e8369/mzaf_4864308834015285864.plus.aac.p.m4a", a:"创造营2021学员" },
  "风的季节": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/cd/de/c5/cddec548-d1e2-d6b3-8a80-5a9490edcb3e/mzaf_15220080419000241413.plus.aac.p.m4a", a:"Paula Tsui" },
  "大风吹": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/63/89/1c/63891c0a-15eb-78f5-73a5-f1b62b9cc2fb/mzaf_12649366699569409575.plus.aac.p.m4a", a:"Wang Heye" },
  "夜空中最亮的星": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/58/a3/c3/58a3c34b-22fa-2a0a-f242-7337ddbf3a18/mzaf_18262480501306858777.plus.aac.p.m4a", a:"逃跑計劃" },
  "夜曲": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/49/d9/63/49d96370-e197-5629-b8bb-bdd954c1b576/mzaf_217123187122990137.plus.aac.p.m4a", a:"周杰倫" },
  "夜夜夜夜": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/e3/a6/4b/e3a64bc2-8568-e97a-ffcb-69e5574bc63d/mzaf_1038019357085600860.plus.aac.p.m4a", a:"Chyi Chin" },
  "夜上海": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/eb/74/02/eb74026c-8919-0694-89a7-e1628e1e008c/mzaf_10992336633775405875.plus.aac.p.m4a", a:"周璇" },
  "夜太黑": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/46/8c/0d/468c0d54-9a89-4876-1a01-ff1b3f5e8fc6/mzaf_14017180233805344026.plus.aac.p.m4a", a:"林憶蓮" },
  "夜的第七章": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/05/5e/83/055e8317-f877-ee59-226e-530bbdc515d4/mzaf_9648278101205594233.plus.aac.p.m4a", a:"Jay Chou" },
  "菊花台": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/89/05/77/89057792-53fb-5219-9177-ab6be6d8c681/mzaf_6615269330965814898.plus.aac.p.m4a", a:"周杰倫" },
  "花海": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/da/0c/0a/da0c0ab8-45b9-18e8-ada2-5dbda4e2e1d2/mzaf_11304493498199301750.plus.aac.p.m4a", a:"Jay Chou" },
  "山路十八弯": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/f2/09/0a/f2090a3a-7471-7400-059d-65ff8adaa956/mzaf_1768133686144242671.plus.aac.p.m4a", a:"李瓊" },
  "宣州谢脁楼饯别校书叔云": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/9a/48/d5/9a48d5bc-607d-4c41-178b-5e0b37477cf3/mzaf_787182069528077892.plus.aac.p.m4a", a:"Renaissance Music & 瑶台墨月" },
  "但愿人长久": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview122/v4/41/7a/d1/417ad136-5e78-d90a-69a3-5bdae20092c1/mzaf_13084538566557688349.plus.aac.p.m4a", a:"珠影乐团" },
  "风继续吹": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/bf/93/a9/bf93a90a-df60-1c6c-6a72-55cb28519817/mzaf_6815738147439457414.plus.aac.p.m4a", a:"周明明" },
  "雾里看花": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/29/0b/11/290b113b-d83b-fc7a-b1bb-3f1581ea0430/mzaf_12141315816627793239.plus.aac.p.m4a", a:"Na Ying" },
  "花田错": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/d0/cc/41/d0cc41bb-98d3-2b94-d66e-24a27b7402d8/mzaf_12914349748595216872.plus.aac.p.m4a", a:"Qing Feng Wu" },
  "酒干倘卖无": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/aa/ca/f6/aacaf67c-8c43-8c09-8ce6-1c5a76d94238/mzaf_10180716126132298589.plus.aac.p.m4a", a:"朱敏 & 王萍" },
  "一壶老酒": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/ba/84/0f/ba840f62-54c3-8d72-3675-6246a49d5bb3/mzaf_5109349686196331325.plus.aac.p.m4a", a:"陆树铭" },
  "平凡之路": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/a7/75/21/a77521d4-d3f3-cbc6-5378-7a724405ee79/mzaf_2541455394975833667.plus.aac.p.m4a", a:"朴樹" },
  "山丘": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/d1/64/cb/d164cb4f-fa15-b864-9161-dad074451384/mzaf_13918210559293677850.plus.aac.p.m4a", a:"李宗盛" },
  "野花": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/8a/13/7b/8a137bfa-921e-0307-58cc-e44f526b0dc0/mzaf_6647777473170567891.plus.aac.p.m4a", a:"田震" },
  "我的未来不是梦": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/4c/ba/84/4cba8455-8e4c-8238-3ad2-7633c2d2deb8/mzaf_12851127854666565826.plus.aac.p.m4a", a:"張雨生" },
  "梦一场": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/61/2e/a1/612ea194-ca88-dd4a-ae89-f39e46f1243b/mzaf_8895424231685498187.plus.aac.p.m4a", a:"Xiaoran Li & Sinje Lee" },
  "青花瓷": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/3a/15/ff/3a15ff0b-ee24-a863-db04-8a489be66397/mzaf_1259240667288251806.plus.aac.p.m4a", a:"周杰倫" },
  "天亮了": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/1b/c8/67/1bc867df-8148-51c1-003b-0a92cd55d40b/mzaf_18327311863318033344.plus.aac.p.m4a", a:"韓紅" },
  "草原上升起不落的太阳": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/3b/0c/8b/3b0c8b9d-9490-4fd9-ba1c-044c6f313bf3/mzaf_7384804924235625092.plus.aac.p.m4a", a:"華華" },
  "月亮代表我的心": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/49/5c/c1/495cc1ec-9838-6edf-66d7-f38638646a85/mzaf_14093067573616253341.plus.aac.p.m4a", a:"鄧麗君" },
  "心太软": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/88/dd/2d/88dd2dbb-be38-5c8c-057d-2e172fa80baa/mzaf_1967138049508701543.plus.aac.p.m4a", a:"Tiger Hu" },
  "从头再来": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/26/6a/d7/266ad7bc-f5a0-23e2-22e2-ab4271c70be2/mzaf_1809906785059688889.plus.aac.p.m4a", a:"劉歡" },
  "醉赤壁": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/ac/7f/37/ac7f3765-f425-bd74-8f13-fde2865d9136/mzaf_6566830801793434058.plus.aac.p.m4a", a:"林俊傑" },
  "无地自容": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/fe/d2/da/fed2dadc-cb11-e746-a8e0-e82df6712e10/mzaf_8182537047237543909.plus.aac.p.m4a", a:"Black Panther" },
  "凡人歌": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/f6/e7/01/f6e70133-5dc5-bcee-b9a5-818b3b3887df/mzaf_13340607560466976816.plus.aac.p.m4a", a:"李宗盛" },
  "风中有朵雨做的云": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/27/0b/bf/270bbf21-17ba-4b10-1cc7-c9f2079e362d/mzaf_6379858052236992750.plus.aac.p.m4a", a:"Mai Meng" },
  "2002年的第一场雪": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/df/a4/be/dfa4be47-7db7-c9a3-4e37-5d29d1c9edb6/mzaf_10754143315150366299.plus.aac.p.m4a", a:"刀郎" },
  "南山南": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/07/f1/5a/07f15aaf-9d68-daed-7c70-c9e2904c1d6f/mzaf_7046538232798178206.plus.aac.p.m4a", a:"馬頔" },
  "一剪梅": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/ed/46/89/ed4689fe-d5c8-ba55-c6a5-606552757ddd/mzaf_5171656342908237347.plus.aac.p.m4a", a:"費玉清" },
  "春风十里": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/b7/c4/8d/b7c48dfc-8144-ba70-e1a9-54c13e493fd9/mzaf_1439006256635396772.plus.aac.p.m4a", a:"Sir Deer" },
  "春天花会开": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/0e/20/3f/0e203f7e-0563-d73c-567a-b4e4e3db5555/mzaf_2480402864004178792.plus.aac.p.m4a", a:"任賢齊" },
  "千里之外": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/1f/7d/8e/1f7d8e3a-5555-5f02-67c2-48175a962ce2/mzaf_9705650129739495572.plus.aac.p.m4a", a:"周杰倫" },
  "沁园春·雪": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/20/7a/43/207a434b-bca2-18f8-1d7d-5ef2ac435cdb/mzaf_11066081027577893903.plus.aac.p.m4a", a:"中唱群星" },
  "桃花朵朵开": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/c6/af/3a/c6af3a91-9e54-8a8a-2a2a-1c8704a7a520/mzaf_10901915392924497926.plus.aac.p.m4a", a:"阿牛" },
  "潇洒走一回": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/ce/d3/6c/ced36c31-872a-d1bf-7c50-ac3409941d5c/mzaf_4735220642573509971.plus.aac.p.m4a", a:"Sally Yeh" },
  "少年": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview124/v4/8c/9d/3f/8c9d3f90-6c42-3d36-b802-61a939f31a90/mzaf_12384318590569844927.plus.aac.p.m4a", a:"許歌淳一, 牛牛凱 & 陳雪濤" },
  "曾经的你": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/a8/43/6c/a8436cdd-8caf-950d-2dae-70656772bc6c/mzaf_10422336988662340264.plus.aac.p.m4a", a:"Xu Wei" },
  "过零丁洋": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/3c/89/93/3c89932c-db12-7d17-5523-b6c75d0b850f/mzaf_13432040155366352504.plus.aac.p.m4a", a:"BabyBus" },
  "精忠报国": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/06/ac/82/06ac82ff-f8b5-02dc-a783-e3d7761620b4/mzaf_1104226639991795553.plus.aac.p.m4a", a:"屠洪刚" },
  "故乡的云": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/6c/2d/53/6c2d5340-2962-4523-99d6-8819246e025b/mzaf_1611293441368819502.plus.aac.p.m4a", a:"Kris Phillips" },
  "长大后我就成了你": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/2d/bb/fd/2dbbfdc9-49d5-5964-4e20-62ba97bcbc88/mzaf_1506394586282037579.plus.aac.p.m4a", a:"Song Zu Ying" },
  "叶子": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview112/v4/f4/7d/f3/f47df3ce-1aff-3867-2208-e49fec833aad/mzaf_11830203890001576950.plus.aac.p.m4a", a:"Landy Wen & Han Tiantian" },
  "寂寞寂寞就好": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/3f/5c/bf/3f5cbf80-cf7d-47bd-ca4f-f733dbe7eb6e/mzaf_11186607586721731408.plus.aac.p.m4a", a:"田馥甄" },
  "我的歌声里": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/fd/0e/8e/fd0e8e85-529e-8dde-f5bf-73f35fb9330d/mzaf_10088429443974622349.plus.aac.p.m4a", a:"曲婉婷" },
  "独家记忆": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/5f/e4/c6/5fe4c6be-988b-5c24-0a79-59e1d4538d4b/mzaf_16336351675557907004.plus.aac.p.m4a", a:"王濛 & Grace Chan" },
  "黑色毛衣": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/41/fd/0c/41fd0c9f-d41a-6227-3468-413405ea68cc/mzaf_16001321407593712643.plus.aac.p.m4a", a:"周杰倫" },
  "红色高跟鞋": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/0f/a0/84/0fa08496-8e5c-6f80-69dd-b8c9b74b6956/mzaf_2136417834970121729.plus.aac.p.m4a", a:"Tanya Chua, Stringer, Della Wu, Tracy Wang & Julius" },
  "相见不如怀念": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/cf/e0/58/cfe0586b-84aa-bfe4-17f2-0695b26bbd7d/mzaf_2247027411299702198.plus.aac.p.m4a", a:"Tarcy Su & Julius" },
  "东风破": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/24/bf/e5/24bfe57b-11ad-fa3d-b618-9986e9a52d7e/mzaf_7036137197905310462.plus.aac.p.m4a", a:"Choiyl" },
  "水中花": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/b2/86/5c/b2865ca3-a83a-6ff7-ea75-b72fd9514945/mzaf_7007219463425953902.plus.aac.p.m4a", a:"郁可唯" },
  "山青水秀": { u:"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview122/v4/b9/61/c7/b961c719-ca75-f7cf-c5ec-16f7dd767d88/mzaf_12127669940905769814.plus.aac.p.m4a", a:"周旋" },
};


