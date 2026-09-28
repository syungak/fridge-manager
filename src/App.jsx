import React, { useState, useEffect } from "react";
import { CATEGORY_DATA } from "./categories";

export default function App() {
  const [activeTab, setActiveTab] = useState("inventory");
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem("fridge_items");
    return saved ? JSON.parse(saved) : [];
  });
  const [shoppingList, setShoppingList] = useState(() => {
    const saved = localStorage.getItem("fridge_shopping");
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedCategory, setSelectedCategory] = useState("野菜");
  const [selectedSubItem, setSelectedSubItem] = useState("キャベツ");
  const [customName, setCustomName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [imagePreview, setImagePreview] = useState(null);

  const [newShoppingItem, setNewShoppingItem] = useState("");

  useEffect(() => {
    localStorage.setItem("fridge_items", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem("fridge_shopping", JSON.stringify(shoppingList));
  }, [shoppingList]);

  const handleCategoryChange = (e) => {
    const cat = e.target.value;
    setSelectedCategory(cat);
    setSelectedSubItem(CATEGORY_DATA[cat][0]);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    const finalName = selectedSubItem === "その他" && customName.trim() ? customName : selectedSubItem;
    const newItem = {
      id: Date.now().toString(),
      category: selectedCategory,
      name: finalName,
      expiryDate,
      quantity: Number(quantity),
      image: imagePreview,
      createdAt: new Date().toISOString()
    };
    setItems([newItem, ...items]);
    setCustomName("");
    setExpiryDate("");
    setImagePreview(null);
    setActiveTab("inventory");
  };

  const handleDeleteItem = (id) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const getDaysUntilExpiry = (dateStr) => {
    if (!dateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(dateStr);
    exp.setHours(0, 0, 0, 0);
    return Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
  };

  const handleAddShoppingItem = (e) => {
    e.preventDefault();
    if (!newShoppingItem.trim()) return;
    setShoppingList([...shoppingList, { id: Date.now().toString(), name: newShoppingItem.trim(), checked: false }]);
    setNewShoppingItem("");
  };

  const toggleShoppingItem = (id) => {
    setShoppingList(
      shoppingList.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const moveCheckedToInventory = () => {
    const bought = shoppingList.filter((i) => i.checked);
    if (bought.length === 0) return;

    const newInventory = bought.map((b) => ({
      id: Date.now().toString() + Math.random(),
      category: "その他",
      name: b.name,
      expiryDate: "",
      quantity: 1,
      image: null,
      createdAt: new Date().toISOString()
    }));

    setItems([...newInventory, ...items]);
    setShoppingList(shoppingList.filter((i) => !i.checked));
  };

  const expiringSoonCount = items.filter((item) => {
    const d = getDaysUntilExpiry(item.expiryDate);
    return d !== null && d <= 3;
  }).length;

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col font-sans pb-20">
      <header className="bg-emerald-600 text-white p-4 shadow-md sticky top-0 z-10 flex justify-between items-center">
        <h1 className="text-xl font-bold tracking-tight">冷蔵庫管理シェア</h1>
        {expiringSoonCount > 0 && (
          <span className="bg-red-500 text-white text-xs px-2.5 py-1 rounded-full font-semibold">
            期限切れ間近: {expiringSoonCount}件
          </span>
        )}
      </header>

      <main className="flex-1 p-4">
        {activeTab === "inventory" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700">現在の冷蔵庫の在庫</h2>
            {items.length === 0 ? (
              <p className="text-gray-400 text-center py-10">在庫がありません。「追加」から登録してください。</p>
            ) : (
              <div className="grid gap-3">
                {items.map((item) => {
                  const days = getDaysUntilExpiry(item.expiryDate);
                  const isExpiring = days !== null && days <= 3;
                  const isExpired = days !== null && days < 0;

                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-lg border bg-white shadow-sm flex items-center justify-between ${
                        isExpired ? "border-red-500 bg-red-50" : isExpiring ? "border-amber-400 bg-amber-50" : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded-md border" />
                        ) : (
                          <div className="w-14 h-14 bg-gray-100 rounded-md flex items-center justify-center text-xs text-gray-400">
                            No Photo
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              {item.category}
                            </span>
                            <span className="font-bold text-gray-800">{item.name}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">数量: {item.quantity}</p>
                          {item.expiryDate && (
                            <p
                              className={`text-xs font-semibold mt-0.5 ${
                                isExpired ? "text-red-600" : isExpiring ? "text-amber-600" : "text-gray-500"
                              }`}
                            >
                              期限: {item.expiryDate} ({days < 0 ? "期限切れ" : days === 0 ? "今日まで" : `あと${days}日`})
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-gray-400 hover:text-red-500 text-sm p-1"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "add" && (
          <form onSubmit={handleAddItem} className="space-y-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-700">食材を追加</h2>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">カテゴリー</label>
              <select
                value={selectedCategory}
                onChange={handleCategoryChange}
                className="w-full border rounded-lg p-2 bg-gray-50 text-sm focus:outline-emerald-500"
              >
                {Object.keys(CATEGORY_DATA).map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">詳細品目</label>
              <select
                value={selectedSubItem}
                onChange={(e) => setSelectedSubItem(e.target.value)}
                className="w-full border rounded-lg p-2 bg-gray-50 text-sm focus:outline-emerald-500"
              >
                {CATEGORY_DATA[selectedCategory].map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            {selectedSubItem === "その他" && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">商品名を入力</label>
                <input
                  type="text"
                  placeholder="品名を入力してください"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full border rounded-lg p-2 text-sm focus:outline-emerald-500"
                  required
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">賞味期限</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full border rounded-lg p-2 text-sm focus:outline-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">数量</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full border rounded-lg p-2 text-sm focus:outline-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">写真 (任意)</label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageChange}
                className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-emerald-50 file:text-emerald-700"
              />
              {imagePreview && (
                <img src={imagePreview} alt="プレビュー" className="mt-2 w-24 h-24 object-cover rounded-md border" />
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-sm shadow mt-2"
            >
              冷蔵庫に登録する
            </button>
          </form>
        )}

        {activeTab === "shopping" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700">買い物リスト</h2>

            <form onSubmit={handleAddShoppingItem} className="flex gap-2">
              <input
                type="text"
                placeholder="買うものを入力..."
                value={newShoppingItem}
                onChange={(e) => setNewShoppingItem(e.target.value)}
                className="flex-1 border rounded-lg p-2 text-sm focus:outline-emerald-500"
              />
              <button
                type="submit"
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700"
              >
                追加
              </button>
            </form>

            <div className="bg-white rounded-lg border border-gray-200 divide-y">
              {shoppingList.length === 0 ? (
                <p className="text-gray-400 text-center py-6 text-sm">買う予定のものはありません。</p>
              ) : (
                shoppingList.map((item) => (
                  <div key={item.id} className="p-3 flex items-center justify-between">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => toggleShoppingItem(item.id)}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      <span className={`text-sm ${item.checked ? "line-through text-gray-400" : "text-gray-700"}`}>
                        {item.name}
                      </span>
                    </label>
                  </div>
                ))
              )}
            </div>

            {shoppingList.some((i) => i.checked) && (
              <button
                onClick={moveCheckedToInventory}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 rounded-lg font-semibold shadow"
              >
                チェックした商品を購入済みにし、冷蔵庫に追加する
              </button>
            )}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t flex justify-around p-2 z-10 shadow-lg">
        <button
          onClick={() => setActiveTab("inventory")}
          className={`text-xs flex flex-col items-center p-1 ${activeTab === "inventory" ? "text-emerald-600 font-bold" : "text-gray-400"}`}
        >
          <span>📦</span>
          <span>在庫一覧</span>
        </button>
        <button
          onClick={() => setActiveTab("add")}
          className={`text-xs flex flex-col items-center p-1 ${activeTab === "add" ? "text-emerald-600 font-bold" : "text-gray-400"}`}
        >
          <span>➕</span>
          <span>食材追加</span>
        </button>
        <button
          onClick={() => setActiveTab("shopping")}
          className={`text-xs flex flex-col items-center p-1 ${activeTab === "shopping" ? "text-emerald-600 font-bold" : "text-gray-400"}`}
        >
          <span>🛒</span>
          <span>買い物リスト</span>
        </button>
      </nav>
    </div>
  );
}
