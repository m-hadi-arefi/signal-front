"use client";
import { useState, useEffect, useCallback } from "react";
import { CommentData } from "@/types";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatRelative, cn } from "@/lib/utils";
import { Heart, Reply, ChevronDown, ChevronUp } from "lucide-react";
import { useMqtt } from "@/hooks/useMqtt";
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui/spinner";

interface CommentSectionProps {
  signalId: string;
}

function CommentItem({ comment, onReply }: { comment: CommentData; onReply: (id: string, username: string) => void }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(comment.isLiked ?? false);
  const [likeCount, setLikeCount] = useState(comment._count?.likes ?? 0);
  const [showReplies, setShowReplies] = useState(false);

  const handleLike = async () => {
    if (!user) return;
    const res = await fetch(`/api/comments/${comment.id}/like`, { method: "POST" });
    if (res.ok) {
      const { liked: l, count } = await res.json();
      setLiked(l);
      setLikeCount(count);
    }
  };

  return (
    <div className="group">
      <div className="flex gap-3">
        <Avatar src={comment.author.avatar} username={comment.author.username} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-sm font-semibold text-white">{comment.author.username}</span>
            <span className="text-xs text-white/30">{formatRelative(comment.createdAt)}</span>
          </div>
          <p className="text-sm text-white/80 leading-relaxed">{comment.content}</p>
          <div className="flex items-center gap-4 mt-2">
            <button onClick={handleLike} className={cn("flex items-center gap-1 text-xs text-white/40 hover:text-white transition-colors", liked && "text-red-400")}>
              <Heart className={cn("w-3.5 h-3.5", liked && "fill-current")} />
              {likeCount > 0 && <span>{likeCount}</span>}
            </button>
            {user && (
              <button onClick={() => onReply(comment.id, comment.author.username)} className="text-xs text-white/40 hover:text-indigo-400 transition-colors flex items-center gap-1">
                <Reply className="w-3.5 h-3.5" /> Reply
              </button>
            )}
          </div>
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-10 mt-3">
          <button onClick={() => setShowReplies(!showReplies)} className="text-xs text-indigo-400 flex items-center gap-1 mb-2">
            {showReplies ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {comment.replies.length} {comment.replies.length === 1 ? "reply" : "replies"}
          </button>
          {showReplies && (
            <div className="space-y-3 border-l border-white/10 pl-3">
              {comment.replies.map((reply) => (
                <CommentItem key={reply.id} comment={reply} onReply={onReply} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function CommentSection({ signalId }: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null);

  const fetchComments = useCallback(async () => {
    const res = await fetch(`/api/signals/${signalId}/comments`);
    if (res.ok) {
      const { data } = await res.json();
      setComments(data);
    }
    setLoading(false);
  }, [signalId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  useMqtt([`comments/${signalId}`], (_, payload: unknown) => {
    const event = payload as { type: string; payload: CommentData };
    if (event.type === "NEW_COMMENT") {
      const newComment = event.payload;
      if (newComment.parentId) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === newComment.parentId
              ? { ...c, replies: [...(c.replies || []), newComment] }
              : c
          )
        );
      } else {
        setComments((prev) => {
          if (prev.find((c) => c.id === newComment.id)) return prev;
          return [...prev, newComment];
        });
      }
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/signals/${signalId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), parentId: replyTo?.id }),
      });
      if (res.ok) {
        setContent("");
        setReplyTo(null);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-base font-semibold text-white">Comments ({comments.length})</h3>

      {user && (
        <form onSubmit={handleSubmit} className="space-y-3">
          {replyTo && (
            <div className="flex items-center gap-2 text-xs text-indigo-400">
              <Reply className="w-3.5 h-3.5" />
              Replying to @{replyTo.username}
              <button type="button" onClick={() => setReplyTo(null)} className="text-white/40 hover:text-white">✕</button>
            </div>
          )}
          <Textarea
            placeholder={replyTo ? `Reply to @${replyTo.username}...` : "Write a comment..."}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={submitting || !content.trim()}>
              {submitting ? <Spinner className="w-4 h-4" /> : "Post"}
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Spinner className="text-indigo-400" /></div>
      ) : (
        <div className="space-y-5">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={(id, username) => setReplyTo({ id, username })}
            />
          ))}
          {comments.length === 0 && (
            <p className="text-center text-sm text-white/30 py-8">No comments yet. Be the first!</p>
          )}
        </div>
      )}
    </div>
  );
}
