import { Badge } from "./badge";

interface SubjectBadgeProps {
  subject: "english" | "chinese";
}

const SUBJECT_LABELS = {
  english: "Tiếng Anh",
  chinese: "Tiếng Trung",
};

export function SubjectBadge({ subject }: SubjectBadgeProps) {
  return (
    <Badge variant={subject}>
      {SUBJECT_LABELS[subject]}
    </Badge>
  );
}
