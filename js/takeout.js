/* ============================================================
   外卖商家数据库 · 40家
   覆盖：快餐/川湘菜/粤菜/日料/韩料/西餐/奶茶/烧烤/火锅/轻食/烘焙/水果
   ============================================================ */

window.TAKEOUT_CATEGORIES = {
  "快餐": { emoji: "🍱", label: "快餐简餐" },
  "川菜": { emoji: "🌶️", label: "川菜" },
  "湘菜": { emoji: "🥘", label: "湘菜" },
  "粤菜": { emoji: "🥢", label: "粤菜茶餐" },
  "日料": { emoji: "🍣", label: "日料寿司" },
  "韩料": { emoji: "🍗", label: "韩料炸鸡" },
  "西餐": { emoji: "🍔", label: "西餐汉堡" },
  "奶茶": { emoji: "🧋", label: "奶茶饮品" },
  "烧烤": { emoji: "🍢", label: "烧烤炸串" },
  "火锅": { emoji: "🍲", label: "火锅冒菜" },
  "轻食": { emoji: "🥗", label: "轻食沙拉" },
  "烘焙": { emoji: "🍰", label: "烘焙甜品" },
  "水果": { emoji: "🍉", label: "水果捞" }
};

window.TAKEOUTS = [
  /* ---------- 快餐简餐 ---------- */
  { id: 1, name: "杨铭宇黄焖鸡米饭", category: "快餐", emoji: "🍗", rating: 4.7, monthSales: 3200, price: 28, deliveryTime: 28, minOrder: 15, deliveryFee: 2, distance: 0.8, signature: ["黄焖鸡米饭", "黄焖排骨", "香菇滑鸡"], tags: ["品质商家", "月售3000+"], desc: "正宗黄焖鸡，鸡肉鲜嫩入味，汤汁拌饭一绝。", promo: "满25减3，满40减6", spicy: 1, mood: ["balance", "comfort"], packageFee: 1 },
  { id: 2, name: "沙县小吃", category: "快餐", emoji: "🥟", rating: 4.5, monthSales: 2800, price: 22, deliveryTime: 25, minOrder: 12, deliveryFee: 1.5, distance: 0.6, signature: ["飘香拌面", "蒸饺", "乌鸡汤"], tags: ["经典老店", "配送快"], desc: "中华美食一条街，拌面蒸饺炖汤，经济实惠。", promo: "满20减2", spicy: 0, mood: ["balance", "light", "comfort"], packageFee: 0.5 },
  { id: 3, name: "兰州拉面", category: "快餐", emoji: "🍜", rating: 4.6, monthSales: 2100, price: 25, deliveryTime: 30, minOrder: 15, deliveryFee: 2, distance: 1.0, signature: ["牛肉拉面", "牛肉炒面", "凉拌黄瓜"], tags: ["手工现拉", "汤鲜面劲"], desc: "一清二白三红四绿五黄，正宗兰州牛肉面。", promo: "满30减4", spicy: 1, mood: ["balance", "comfort"], packageFee: 1 },
  { id: 4, name: "麦当劳", category: "快餐", emoji: "🍟", rating: 4.8, monthSales: 5600, price: 38, deliveryTime: 22, minOrder: 20, deliveryFee: 5, distance: 1.5, signature: ["麦辣鸡腿堡", "巨无霸", "薯条"], tags: ["品牌连锁", "准时达"], desc: "I'm lovin' it，经典汉堡薯条，快乐源泉。", promo: "外卖专享套餐立减10元", spicy: 1, mood: ["balance", "comfort"], packageFee: 1.5 },
  { id: 5, name: "肯德基", category: "快餐", emoji: "🍗", rating: 4.7, monthSales: 4800, price: 40, deliveryTime: 25, minOrder: 25, deliveryFee: 5, distance: 1.8, signature: ["吮指原味鸡", "香辣鸡腿堡", "蛋挞"], tags: ["品牌连锁", "疯狂星期四"], desc: "上校秘制配方，吮指回味，自在滋味。", promo: "疯狂星期四特惠", spicy: 1, mood: ["balance", "comfort"], packageFee: 1.5 },

  /* ---------- 川湘菜 ---------- */
  { id: 6, name: "川味小馆", category: "川菜", emoji: "🌶️", rating: 4.6, monthSales: 1900, price: 45, deliveryTime: 35, minOrder: 25, deliveryFee: 3, distance: 1.2, signature: ["麻婆豆腐", "水煮肉片", "回锅肉"], tags: ["地道川味", "下饭神器"], desc: "四川师傅掌勺，麻辣鲜香正宗，每道菜都能拌饭。", promo: "满50减8，满80减15", spicy: 3, mood: ["spicy", "balance"], packageFee: 1 },
  { id: 7, name: "湘菜馆", category: "湘菜", emoji: "🥘", rating: 4.5, monthSales: 1500, price: 48, deliveryTime: 38, minOrder: 30, deliveryFee: 3.5, distance: 1.5, signature: ["剁椒鱼头", "小炒黄牛肉", "辣椒炒肉"], tags: ["香辣过瘾", "湘菜代表"], desc: "无辣不欢，湘菜的香辣热烈，一碗饭不够吃。", promo: "满60减10", spicy: 3, mood: ["spicy"], packageFee: 1 },
  { id: 8, name: "蜀香源", category: "川菜", emoji: "🍲", rating: 4.7, monthSales: 2200, price: 42, deliveryTime: 32, minOrder: 20, deliveryFee: 2.5, distance: 0.9, signature: ["冒菜", "串串香", "夫妻肺片"], tags: ["川味冒菜", "自选搭配"], desc: "一个人的火锅，冒菜自选，麻辣鲜香超过瘾。", promo: "满35减5", spicy: 2, mood: ["spicy", "comfort"], packageFee: 1 },
  { id: 9, name: "重庆小面", category: "川菜", emoji: "🍜", rating: 4.6, monthSales: 2600, price: 25, deliveryTime: 28, minOrder: 15, deliveryFee: 2, distance: 1.1, signature: ["豌杂面", "肥肠面", "酸辣粉"], tags: ["重庆正宗", "麻辣鲜香"], desc: "重庆街头味道，小面麻辣鲜香，豌杂面绝了。", promo: "满25减3", spicy: 2, mood: ["spicy", "comfort"], packageFee: 0.5 },
  { id: 10, name: "辣妹子湘菜馆", category: "湘菜", emoji: "🌶️", rating: 4.4, monthSales: 1200, price: 50, deliveryTime: 40, minOrder: 30, deliveryFee: 4, distance: 2.0, signature: ["口味虾", "干锅牛蛙", "湘西外婆菜"], tags: ["湘菜特色", "重口味"], desc: "湖南妹子开的店，口味虾和干锅牛蛙是招牌。", promo: "满80减12", spicy: 3, mood: ["spicy"], packageFee: 1.5 },

  /* ---------- 粤菜茶餐厅 ---------- */
  { id: 11, name: "港式茶餐厅", category: "粤菜", emoji: "🍛", rating: 4.7, monthSales: 2400, price: 42, deliveryTime: 30, minOrder: 25, deliveryFee: 3, distance: 1.3, signature: ["叉烧饭", "干炒牛河", "丝袜奶茶"], tags: ["港式风味", "茶餐厅首选"], desc: "地道港式茶餐厅，叉烧饭配丝袜奶茶，假装在香港。", promo: "满40减6", spicy: 0, mood: ["balance", "light"], packageFee: 1 },
  { id: 12, name: "潮汕砂锅粥", category: "粤菜", emoji: "🍚", rating: 4.8, monthSales: 1800, price: 55, deliveryTime: 35, minOrder: 30, deliveryFee: 3.5, distance: 1.6, signature: ["虾蟹粥", "蚝烙", "卤水拼盘"], tags: ["砂锅现熬", "暖胃养生"], desc: "砂锅现熬海鲜粥，虾蟹鲜甜融入粥底，暖胃又养生。", promo: "满60减8", spicy: 0, mood: ["light", "comfort"], packageFee: 1 },
  { id: 13, name: "粤记烧腊", category: "粤菜", emoji: "🍖", rating: 4.6, monthSales: 2000, price: 38, deliveryTime: 28, minOrder: 20, deliveryFee: 2.5, distance: 1.0, signature: ["烧鹅饭", "叉烧双拼", "白切鸡"], tags: ["烧腊专家", "皮脆肉嫩"], desc: "现烤烧腊，皮脆肉嫩，叉烧双拼饭是经典。", promo: "满35减5", spicy: 0, mood: ["balance", "light"], packageFee: 1 },

  /* ---------- 日料寿司 ---------- */
  { id: 14, name: "寿司郎", category: "日料", emoji: "🍣", rating: 4.8, monthSales: 3100, price: 65, deliveryTime: 35, minOrder: 40, deliveryFee: 5, distance: 1.8, signature: ["三文鱼寿司", "鳗鱼饭", "天妇罗"], tags: ["日式连锁", "新鲜刺身"], desc: "日本连锁寿司品牌，新鲜刺身，每一贯都是匠心。", promo: "满80减15", spicy: 0, mood: ["light", "balance"], packageFee: 2 },
  { id: 15, name: "一兰拉面", category: "日料", emoji: "🍜", rating: 4.7, monthSales: 2800, price: 58, deliveryTime: 32, minOrder: 35, deliveryFee: 4, distance: 2.0, signature: ["豚骨拉面", "半熟蛋", "抹茶杏仁豆腐"], tags: ["博多豚骨", "一人食格"], desc: "博多豚骨拉面，浓郁汤底，细面劲道，一口入魂。", promo: "外卖加购半熟蛋1元", spicy: 1, mood: ["comfort", "balance"], packageFee: 2 },
  { id: 16, name: "日式咖喱饭", category: "日料", emoji: "🍛", rating: 4.5, monthSales: 1600, price: 42, deliveryTime: 30, minOrder: 25, deliveryFee: 3, distance: 1.4, signature: ["猪排咖喱饭", "牛肉咖喱", "可乐饼"], tags: ["日式咖喱", "浓郁香甜"], desc: "日式咖喱香甜浓郁，猪排酥脆，配米饭绝了。", promo: "满40减5", spicy: 0, mood: ["balance", "comfort"], packageFee: 1 },

  /* ---------- 韩料炸鸡 ---------- */
  { id: 17, name: "韩式炸鸡店", category: "韩料", emoji: "🍗", rating: 4.6, monthSales: 2900, price: 55, deliveryTime: 35, minOrder: 40, deliveryFee: 4, distance: 1.7, signature: ["蜂蜜黄油炸鸡", "辣味炸鸡", "芝士球"], tags: ["韩式炸鸡", "追剧必备"], desc: "正宗韩式炸鸡，蜂蜜黄油味香甜酥脆，配啤酒绝了。", promo: "满60减10，炸鸡+可乐套餐", spicy: 2, mood: ["spicy", "comfort"], packageFee: 2 },
  { id: 18, name: "石锅拌饭", category: "韩料", emoji: "🍚", rating: 4.5, monthSales: 1800, price: 38, deliveryTime: 30, minOrder: 20, deliveryFee: 2.5, distance: 1.2, signature: ["牛肉石锅拌饭", "部队锅", "辣炒年糕"], tags: ["韩式简餐", "锅巴香脆"], desc: "石锅拌饭锅巴香脆，拌上韩式辣酱，越吃越香。", promo: "满35减5", spicy: 2, mood: ["spicy", "balance"], packageFee: 1 },
  { id: 19, name: "韩国烤肉外卖", category: "韩料", emoji: "🥩", rating: 4.7, monthSales: 1500, price: 78, deliveryTime: 40, minOrder: 50, deliveryFee: 5, distance: 2.2, signature: ["烤五花肉", "烤牛舌", "泡菜汤"], tags: ["韩式烤肉", "在家也能吃"], desc: "烤好的五花肉配生菜蒜片，在家享受韩式烤肉。", promo: "满100减20", spicy: 1, mood: ["comfort", "balance"], packageFee: 2 },

  /* ---------- 西餐汉堡披萨 ---------- */
  { id: 20, name: "必胜客", category: "西餐", emoji: "🍕", rating: 4.6, monthSales: 3500, price: 72, deliveryTime: 35, minOrder: 50, deliveryFee: 6, distance: 2.0, signature: ["超级至尊披萨", "意面", "鸡翅"], tags: ["品牌连锁", "披萨专家"], desc: "现烤披萨芝士拉丝，超级至尊料足味美。", promo: "外卖披萨立减20元", spicy: 1, mood: ["balance", "comfort"], packageFee: 2 },
  { id: 21, name: "汉堡王", category: "西餐", emoji: "🍔", rating: 4.7, monthSales: 3200, price: 45, deliveryTime: 28, minOrder: 25, deliveryFee: 4, distance: 1.6, signature: ["皇堡", "薯条", "洋葱圈"], tags: ["真火烤", "汉堡专家"], desc: "真火烤牛肉饼，皇堡分量十足，肉食者的快乐。", promo: "满40减8", spicy: 1, mood: ["comfort", "balance"], packageFee: 1.5 },
  { id: 22, name: "意式手工披萨", category: "西餐", emoji: "🍕", rating: 4.8, monthSales: 1200, price: 85, deliveryTime: 40, minOrder: 60, deliveryFee: 5, distance: 2.5, signature: ["玛格丽特披萨", "意式肉酱面", "提拉米苏"], tags: ["手工现做", "意式风味"], desc: "意大利师傅手工现做，薄底披萨酥脆，正宗意式风味。", promo: "满100减15", spicy: 0, mood: ["balance"], packageFee: 2 },

  /* ---------- 奶茶饮品 ---------- */
  { id: 23, name: "喜茶", category: "奶茶", emoji: "🧋", rating: 4.8, monthSales: 6800, price: 28, deliveryTime: 25, minOrder: 20, deliveryFee: 3, distance: 1.2, signature: ["多肉葡萄", "芝芝莓莓", "烤黑糖波波"], tags: ["新茶饮头部", "鲜果茶"], desc: "灵感之茶，多肉葡萄果肉满满，芝士奶盖浓郁。", promo: "外卖免配送费", spicy: 0, mood: ["light", "balance"], packageFee: 0 },
  { id: 24, name: "奈雪的茶", category: "奶茶", emoji: "🍵", rating: 4.7, monthSales: 5200, price: 30, deliveryTime: 28, minOrder: 25, deliveryFee: 3, distance: 1.5, signature: ["霸气橙子", "草莓魔法棒", "冻顶乌龙"], tags: ["茶+软欧包", "鲜果茶"], desc: "一杯好茶一口软欧包，霸气橙子鲜爽解渴。", promo: "满30减5", spicy: 0, mood: ["light"], packageFee: 0 },
  { id: 25, name: "蜜雪冰城", category: "奶茶", emoji: "🍦", rating: 4.5, monthSales: 8500, price: 10, deliveryTime: 20, minOrder: 10, deliveryFee: 1, distance: 0.5, signature: ["柠檬水", "珍珠奶茶", "摩天脆脆"], tags: ["性价比之王", "月售8000+"], desc: "你爱我我爱你蜜雪冰城甜蜜蜜，柠檬水yyds。", promo: "满15减2", spicy: 0, mood: ["light", "balance"], packageFee: 0 },
  { id: 26, name: "茶百道", category: "奶茶", emoji: "🧋", rating: 4.6, monthSales: 4200, price: 18, deliveryTime: 25, minOrder: 15, deliveryFee: 2, distance: 0.8, signature: ["杨枝甘露", "豆乳玉麒麟", "西瓜啵啵"], tags: ["成都茶饮", "小料丰富"], desc: "杨枝甘露料足味美，豆乳玉麒麟香浓醇厚。", promo: "满25减4", spicy: 0, mood: ["light"], packageFee: 0 },
  { id: 27, name: "瑞幸咖啡", category: "奶茶", emoji: "☕", rating: 4.7, monthSales: 7200, price: 20, deliveryTime: 22, minOrder: 15, deliveryFee: 3, distance: 1.0, signature: ["生椰拿铁", "丝绒拿铁", "陨石拿铁"], tags: ["国民咖啡", "生椰YYDS"], desc: "生椰拿铁椰香浓郁，打工人的续命神器。", promo: "新人首杯9.9", spicy: 0, mood: ["light", "balance"], packageFee: 0 },

  /* ---------- 烧烤炸串 ---------- */
  { id: 28, name: "东北炭火烧烤", category: "烧烤", emoji: "🍢", rating: 4.7, monthSales: 2100, price: 55, deliveryTime: 38, minOrder: 30, deliveryFee: 4, distance: 1.5, signature: ["烤羊肉串", "烤茄子", "烤韭菜"], tags: ["东北烧烤", "炭火现烤"], desc: "东北师傅炭火现烤，羊肉串滋滋冒油，夜宵首选。", promo: "满50减8，满100减20", spicy: 2, mood: ["spicy", "comfort"], packageFee: 1 },
  { id: 29, name: "炸串研究所", category: "烧烤", emoji: "🍡", rating: 4.6, monthSales: 2800, price: 35, deliveryTime: 30, minOrder: 20, deliveryFee: 2.5, distance: 1.0, signature: ["炸年糕", "炸里脊肉", "炸金针菇"], tags: ["网红炸串", "酱料一绝"], desc: "秘制酱料炸串，外酥里嫩，年糕裹满酱料绝了。", promo: "满30减5", spicy: 1, mood: ["spicy", "comfort"], packageFee: 1 },
  { id: 30, name: "锡纸花甲粉", category: "烧烤", emoji: "🍲", rating: 4.5, monthSales: 1900, price: 28, deliveryTime: 32, minOrder: 18, deliveryFee: 2, distance: 1.2, signature: ["锡纸花甲粉", "锡纸金针菇", "烤生蚝"], tags: ["锡纸花甲", "鲜辣过瘾"], desc: "锡纸包裹锁住鲜味，花甲粉鲜辣过瘾，汤都喝光。", promo: "满25减3", spicy: 2, mood: ["spicy", "comfort"], packageFee: 1 },

  /* ---------- 火锅冒菜 ---------- */
  { id: 31, name: "海底捞外送", category: "火锅", emoji: "🍲", rating: 4.9, monthSales: 1600, price: 98, deliveryTime: 45, minOrder: 80, deliveryFee: 8, distance: 2.8, signature: ["番茄锅底", "毛肚", "虾滑"], tags: ["服务到家", "锅具可借"], desc: "海底捞火锅送到家，番茄锅底浓郁，还能借锅具。", promo: "满200减30，借锅免费", spicy: 2, mood: ["comfort", "spicy"], packageFee: 3 },
  { id: 32, name: "麻辣烫", category: "火锅", emoji: "🍜", rating: 4.5, monthSales: 3200, price: 32, deliveryTime: 30, minOrder: 18, deliveryFee: 2, distance: 0.9, signature: ["自选麻辣烫", "麻辣拌", "骨汤麻辣烫"], tags: ["自选搭配", "丰俭由人"], desc: "自选食材麻辣烫，麻辣鲜香，一个人的小火锅。", promo: "满25减4", spicy: 2, mood: ["spicy", "comfort"], packageFee: 1 },
  { id: 33, name: "冒菜先生", category: "火锅", emoji: "🥘", rating: 4.6, monthSales: 2400, price: 38, deliveryTime: 32, minOrder: 22, deliveryFee: 2.5, distance: 1.1, signature: ["牛肉冒菜", "毛肚冒菜", "素冒菜"], tags: ["川味冒菜", "麻辣鲜香"], desc: "成都冒菜，麻辣鲜香，牛肉嫩滑，配米饭绝了。", promo: "满35减5", spicy: 3, mood: ["spicy"], packageFee: 1 },

  /* ---------- 轻食沙拉 ---------- */
  { id: 34, name: "轻食沙拉", category: "轻食", emoji: "🥗", rating: 4.7, monthSales: 1800, price: 42, deliveryTime: 28, minOrder: 25, deliveryFee: 3, distance: 1.3, signature: ["鸡胸肉沙拉", "牛油果沙拉", "藜麦饭"], tags: ["低卡健康", "健身餐"], desc: "低卡轻食，鸡胸肉嫩滑，牛油果营养，减脂期好选择。", promo: "满40减6", spicy: 0, mood: ["light"], packageFee: 1 },
  { id: 35, name: "波奇饭", category: "轻食", emoji: "🍚", rating: 4.6, monthSales: 1500, price: 48, deliveryTime: 30, minOrder: 30, deliveryFee: 3.5, distance: 1.6, signature: ["三文鱼波奇饭", "牛肉波奇饭", "金枪鱼沙拉"], tags: ["夏威夷风味", "健康轻食"], desc: "夏威夷波奇饭，三文鱼新鲜，藜麦底健康又好吃。", promo: "满50减8", spicy: 0, mood: ["light", "balance"], packageFee: 1 },
  { id: 36, name: "三明治咖啡", category: "轻食", emoji: "🥪", rating: 4.5, monthSales: 2000, price: 35, deliveryTime: 25, minOrder: 20, deliveryFee: 2, distance: 1.0, signature: ["鸡胸肉三明治", "牛肉帕尼尼", "美式咖啡"], tags: ["早餐首选", "轻食简餐"], desc: "现做三明治，面包酥脆，馅料丰富，早餐午餐都合适。", promo: "早餐套餐立减5元", spicy: 0, mood: ["light", "balance"], packageFee: 1 },

  /* ---------- 烘焙甜品 ---------- */
  { id: 37, name: "网红甜品店", category: "烘焙", emoji: "🍰", rating: 4.8, monthSales: 2200, price: 38, deliveryTime: 32, minOrder: 25, deliveryFee: 3, distance: 1.4, signature: ["舒芙蕾", "芒果班戟", "杨枝甘露"], tags: ["网红打卡", "甜品精致"], desc: "ins风甜品店，舒芙蕾蓬松入口即化，环境适合拍照。", promo: "满40减6", spicy: 0, mood: ["light"], packageFee: 1 },
  { id: 38, name: "面包工坊", category: "烘焙", emoji: "🥐", rating: 4.7, monthSales: 1600, price: 30, deliveryTime: 28, minOrder: 20, deliveryFee: 2.5, distance: 1.2, signature: ["可颂", "吐司", "肉桂卷"], tags: ["现烤面包", "麦香浓郁"], desc: "每日现烤面包，可颂层层酥脆，吐司松软香甜。", promo: "满30减4", spicy: 0, mood: ["light", "balance"], packageFee: 1 },

  /* ---------- 水果捞 ---------- */
  { id: 39, name: "鲜果切", category: "水果", emoji: "🍉", rating: 4.6, monthSales: 2500, price: 25, deliveryTime: 25, minOrder: 15, deliveryFee: 2, distance: 0.8, signature: ["西瓜切", "芒果切", "混合果切"], tags: ["新鲜现切", "补充维C"], desc: "新鲜水果现切，西瓜甜爽，芒果香浓，健康又美味。", promo: "满25减3", spicy: 0, mood: ["light"], packageFee: 1 },
  { id: 40, name: "酸奶水果捞", category: "水果", emoji: "🥛", rating: 4.7, monthSales: 1900, price: 28, deliveryTime: 28, minOrder: 18, deliveryFee: 2, distance: 1.0, signature: ["招牌水果捞", "芋圆水果捞", "西米露"], tags: ["手工酸奶", "料足味美"], desc: "手工酸奶搭配新鲜水果，芋圆Q弹，健康甜品首选。", promo: "满30减5", spicy: 0, mood: ["light"], packageFee: 1 }
];

/* 配送时间档位 */
window.DELIVERY_TIME_OPTIONS = [
  { val: "30", label: "30分钟内", min: 0, max: 30 },
  { val: "45", label: "45分钟内", min: 0, max: 45 },
  { val: "60", label: "60分钟内", min: 0, max: 60 },
  { val: "any", label: "不限时间", min: 0, max: 999 }
];

/* 外卖品类选项（用于条件筛选） */
window.TAKEOUT_CATEGORY_OPTIONS = [
  { val: "any", label: "不挑，AI定", emoji: "🍽️" },
  { val: "快餐", label: "快餐简餐", emoji: "🍱" },
  { val: "川菜", label: "川湘菜", emoji: "🌶️" },
  { val: "粤菜", label: "粤菜茶餐", emoji: "🥢" },
  { val: "日料", label: "日料寿司", emoji: "🍣" },
  { val: "韩料", label: "韩料炸鸡", emoji: "🍗" },
  { val: "西餐", label: "西餐汉堡", emoji: "🍔" },
  { val: "奶茶", label: "奶茶饮品", emoji: "🧋" },
  { val: "烧烤", label: "烧烤炸串", emoji: "🍢" },
  { val: "火锅", label: "火锅冒菜", emoji: "🍲" },
  { val: "轻食", label: "轻食沙拉", emoji: "🥗" },
  { val: "烘焙", label: "烘焙甜品", emoji: "🍰" }
];
