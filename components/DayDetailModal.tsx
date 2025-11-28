import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { DayInfo } from '@/types/cycle';
import { Note, QUICK_ACCESS_EMOJIS } from '@/types/note';
import { notesApi } from '@/api/notes';
import { useI18n } from '@/i18n/provider';

interface DayDetailModalProps {
  visible: boolean;
  date: string;
  dayInfo?: DayInfo;
  onClose: () => void;
  onNoteUpdated?: () => void;
}

export const DayDetailModal: React.FC<DayDetailModalProps> = ({
  visible,
  date,
  dayInfo,
  onClose,
  onNoteUpdated,
}) => {
  const { t } = useI18n();
  const [note, setNote] = useState<Note | null>(null);
  const [noteText, setNoteText] = useState('');
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadNote = async () => {
      try {
        setIsLoading(true);
        const noteData = await notesApi.getNoteByDate(date);
        setNote(noteData);
        setNoteText(noteData?.text || '');
        setSelectedEmojis(noteData?.emoji_notes.map((en) => en.emoji) || []);
      } catch (error) {
        console.error('Error loading note:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (visible && date) {
      loadNote();
    }
  }, [visible, date]);

  const handleSaveNote = async () => {
    try {
      setIsSaving(true);

      const emoji_notes = selectedEmojis.map((emoji) => ({
        emoji,
        description: '', // You can add descriptions later if needed
      }));

      const noteData = {
        date,
        text: noteText,
        emoji_notes,
      };

      if (note) {
        await notesApi.updateNote(date, {
          text: noteText,
          emoji_notes,
        });
      } else {
        await notesApi.createNote(noteData);
      }

      onNoteUpdated?.();
      onClose();
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async () => {
    try {
      setIsSaving(true);
      await notesApi.deleteNote(date);
      onNoteUpdated?.();
      onClose();
    } catch (error) {
      console.error('Error deleting note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEmoji = (emoji: string) => {
    setSelectedEmojis((prev) =>
      prev.includes(emoji) ? prev.filter((e) => e !== emoji) : [...prev, emoji]
    );
  };

  const getDayTypeText = () => {
    if (!dayInfo?.type) return '';

    const types: Record<string, string> = {
      period: t('calendar.period'),
      ovulation: t('calendar.ovulation'),
      fertile: t('calendar.fertile'),
    };

    return types[dayInfo.type] || '';
  };

  const getDayTypeColor = () => {
    if (!dayInfo?.type) return 'bg-gray-100 text-gray-700';

    const colors: Record<string, string> = {
      period: 'bg-red-100 text-red-700',
      ovulation: 'bg-green-100 text-green-700',
      fertile: 'bg-green-50 text-green-600',
    };

    return colors[dayInfo.type] || 'bg-gray-100 text-gray-700';
  };

  const dayType = getDayTypeText();

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="rounded-t-3xl bg-white">
          {/* Header */}
          <View className="flex-row items-center justify-between border-b border-gray-200 px-6 py-4">
            <Text className="text-xl font-bold text-gray-900">
              {new Date(date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-2xl text-gray-500">×</Text>
            </TouchableOpacity>
          </View>

          <KeyboardAwareScrollView
            className="px-6 py-4"
            enableOnAndroid={true}
            enableAutomaticScroll={true}
            extraScrollHeight={260}
            viewIsInsideTabBar={false}
            keyboardShouldPersistTaps="handled">
            {isLoading ? (
              <ActivityIndicator size="large" color="#ec4899" />
            ) : (
              <>
                {/* Day Type Badge */}
                {dayType && (
                  <View className={`mb-4 self-start rounded-full px-4 py-2 ${getDayTypeColor()}`}>
                    <Text className="font-semibold">
                      {getDayTypeText()}
                      {dayInfo?.isPredicted && ` (${t('calendar.predicted')})`}
                    </Text>
                  </View>
                )}

                {/* Quick Emoji Selection */}
                <Text className="mb-2 text-sm font-semibold text-gray-700">
                  {t('dayDetail.emojiNote')}
                </Text>
                <View className="mb-4 flex-row flex-wrap gap-2">
                  {QUICK_ACCESS_EMOJIS.map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      onPress={() => toggleEmoji(emoji)}
                      className={`rounded-lg border-2 p-3 ${
                        selectedEmojis.includes(emoji)
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-300 bg-white'
                      }`}>
                      <Text className="text-2xl">{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Note Text Input */}
                <Text className="mb-2 text-sm font-semibold text-gray-700">
                  {t('dayDetail.note')}
                </Text>
                <TextInput
                  className="mb-4 rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900"
                  value={noteText}
                  onChangeText={setNoteText}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />

                {/* Action Buttons */}
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={handleSaveNote}
                    disabled={isSaving}
                    className={`flex-1 rounded-lg bg-red-600 py-4 ${isSaving ? 'opacity-50' : ''}`}>
                    {isSaving ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-center font-semibold text-white">
                        {t('common.save')}
                      </Text>
                    )}
                  </TouchableOpacity>

                  {note && (
                    <TouchableOpacity
                      onPress={handleDeleteNote}
                      disabled={isSaving}
                      className={`rounded-lg bg-red-500 px-6 py-4 ${isSaving ? 'opacity-50' : ''}`}>
                      <Text className="text-center font-semibold text-white">
                        {t('common.delete')}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </KeyboardAwareScrollView>
        </View>
      </View>
    </Modal>
  );
};
