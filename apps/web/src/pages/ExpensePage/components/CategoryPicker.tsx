import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';

interface CategoryPickerProps {
  categories: any[]; // top-level groups with children
  selectedId: string;
  onSelect: (categoryId: string, category: any) => void;
  type: 'EXPENSE' | 'INCOME';
}

export function CategoryPicker({ categories, selectedId, onSelect, type }: CategoryPickerProps) {
  const [selectedGroup, setSelectedGroup] = useState<any>(null);

  const filteredGroups = categories.filter(c => c.type === type);

  // Find selected category display
  const findSelected = () => {
    for (const group of filteredGroups) {
      if (group.id === selectedId) return { ...group, groupName: null };
      const child = group.children?.find((c: any) => c.id === selectedId);
      if (child) return { ...child, groupName: group.name };
    }
    return null;
  };

  const selectedCat = findSelected();

  const handleGroupClick = (group: any) => {
    if (!group.children || group.children.length === 0) {
      // Leaf category — select directly
      onSelect(group.id, group);
      setSelectedGroup(null);
    } else {
      setSelectedGroup(group);
    }
  };

  const handleChildClick = (child: any, group: any) => {
    onSelect(child.id, { ...child, parent: group });
    setSelectedGroup(null);
  };

  return (
    <div className="space-y-3">
      {/* Selected preview */}
      {selectedCat && (
        <div className="flex items-center gap-2 text-[13px] font-bold text-[var(--color-text-muted)]">
          <span className="text-lg">{selectedCat.icon}</span>
          <span>{selectedCat.groupName ? `${selectedCat.groupName} / ` : ''}{selectedCat.name}</span>
        </div>
      )}

      <AnimatePresence mode="wait">
        {!selectedGroup ? (
          <motion.div
            key="groups"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="grid grid-cols-4 gap-2"
          >
            {filteredGroups.map((group) => (
              <motion.button
                key={group.id}
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleGroupClick(group)}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border transition-all ${
                  group.id === selectedId || group.children?.some((c: any) => c.id === selectedId)
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)]/50 hover:border-blue-500/30 hover:bg-blue-500/5'
                }`}
              >
                <span className="text-2xl">{group.icon}</span>
                <span className="text-[10px] font-bold text-center leading-tight line-clamp-2">{group.name}</span>
              </motion.button>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="children"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-2"
          >
            <button
              type="button"
              onClick={() => setSelectedGroup(null)}
              className="flex items-center gap-1.5 text-[13px] font-bold text-blue-500 hover:underline"
            >
              <ChevronLeft size={16} />
              <span className="text-lg">{selectedGroup.icon}</span>
              {selectedGroup.name}
            </button>
            <div className="grid grid-cols-4 gap-2">
              {selectedGroup.children.map((child: any) => (
                <motion.button
                  key={child.id}
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleChildClick(child, selectedGroup)}
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border transition-all ${
                    child.id === selectedId
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)]/50 hover:border-blue-500/30 hover:bg-blue-500/5'
                  }`}
                >
                  <span className="text-2xl">{child.icon}</span>
                  <span className="text-[10px] font-bold text-center leading-tight line-clamp-2">{child.name}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
