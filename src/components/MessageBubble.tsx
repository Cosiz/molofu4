import type { Message } from '../types';
import { colors, typography, spacing, borderRadius } from '../theme';
import { timeAgo } from '../utils/time';

interface MessageBubbleProps {
  message: Message;
  isSent: boolean;
}

export function MessageBubble({ message, isSent }: MessageBubbleProps) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: isSent ? 'flex-end' : 'flex-start',
      marginBottom: spacing.sm,
    }}>
      <div style={{
        maxWidth: '75%',
        padding: `${spacing.sm} ${spacing.md}`,
        borderRadius: borderRadius.lg,
        borderBottomRightRadius: isSent ? spacing.sm : borderRadius.lg,
        borderBottomLeftRadius: isSent ? borderRadius.lg : spacing.sm,
        background: isSent ? colors.primary : colors.card,
        color: isSent ? colors.card : colors.textPrimary,
        boxShadow: `0 1px 2px ${colors.shadow}`,
      }}>
        <div style={{ ...typography.body }}>{message.text}</div>
        <div style={{
          ...typography.small,
          color: isSent ? colors.card + '80' : colors.textSecondary,
          marginTop: 4,
          textAlign: isSent ? 'right' : 'left',
        }}>
          {timeAgo(message.timestamp)}
          {isSent && message.read && ' ✓✓'}
        </div>
      </div>
    </div>
  );
}
