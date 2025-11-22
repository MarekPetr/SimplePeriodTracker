import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { DayInfo } from '@/types/cycle';
import { Note, QUICK_ACCESS_EMOJIS } from '@/types/note';
import { noteApi } from '@/api/note';
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
    if (visible && date) {
      loadNote();
    }
  }, [visible, date]);

  const loadNote = async () => {
    try {
      setIsLoading(true);
      const noteData = await noteApi.getNoteByDate(date);
      setNote(noteData);
      setNoteText(noteData?.content || '');
      setSelectedEmojis(noteData?.emojis || []);
    } catch (error) {
      console.error('Error loading note:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNote = async () => {
    try {
      setIsSaving(true);

      const noteData = {
        date,
        content: noteText,
        emojis: selectedEmojis,
      };

      if (note) {
        await noteApi.updateNote(date, {
          content: noteText,
          emojis: selectedEmojis,
        });
      } else {
        await noteApi.createNote(noteData);
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
      await noteApi.deleteNote(date);
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
    if (!dayInfo?.type) return 'Regular Day';

    const types: Record<string, string> = {
      period: 'Period Day',
      ovulation: 'Ovulation Day',
      fertile: 'Fertile Window',
    };

    return types[dayInfo.type] || 'Regular Day';
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end bg-black/50"
      >
        <View className="bg-white rounded-t-3xl max-h-[85%]">
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 py-4 border-b border-gray-200">
            <Text className="text-xl font-bold text-gray-900">
              {new Date(date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-gray-500 text-2xl">×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="px-6 py-4" keyboardShouldPersistTaps="handled">
            {isLoading ? (
              <ActivityIndicator size="large" color="#ec4899" />
            ) : (
              <>
                {/* Day Type Badge */}
                <View className={`self-start px-4 py-2 rounded-full mb-4 ${getDayTypeColor()}`}>
                  <Text className="font-semibold">
                    {getDayTypeText()}
                    {dayInfo?.isPredicted && ' (Predicted)'}
                  </Text>
                </View>

                {/* Quick Emoji Selection */}
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Quick Emoji Notes:
                </Text>
                <View className="flex-row flex-wrap gap-2 mb-4">
                  {QUICK_ACCESS_EMOJIS.map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      onPress={() => toggleEmoji(emoji)}
                      className={`p-3 rounded-lg border-2 ${
                        selectedEmojis.includes(emoji)
                          ? 'border-pink-500 bg-pink-50'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      <Text className="text-2xl">{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Note Text Input */}
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Note:
                </Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900 mb-4"
                  placeholder="Add a note for this day..."
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
                    className={`flex-1 bg-pink-600 rounded-lg py-4 ${
                      isSaving ? 'opacity-50' : ''
                    }`}
                  >
                    {isSaving ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-white text-center font-semibold">
                        Save Note
                      </Text>
                    )}
                  </TouchableOpacity>

                  {note && (
                    <TouchableOpacity
                      onPress={handleDeleteNote}
                      disabled={isSaving}
                      className={`px-6 bg-red-500 rounded-lg py-4 ${
                        isSaving ? 'opacity-50' : ''
                      }`}
                    >
                      <Text className="text-white text-center font-semibold">
                        Delete
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
