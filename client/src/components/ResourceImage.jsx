import { useEffect, useState } from 'react';
import { BookOpen, GraduationCap, Presentation, Video } from 'lucide-react';
import api from '../services/api.js';

const icons = {
  Video,
  Course: GraduationCap,
  Presentation,
  Document: BookOpen,
};

export default function ResourceImage({ resource, className = '' }) {
  const [src, setSrc] = useState(resource.thumbnailUrl || '');
  const [failed, setFailed] = useState(false);
  const Icon = icons[resource.resourceType] || BookOpen;

  useEffect(() => {
    setFailed(false);
    if (resource.thumbnailUrl) {
      setSrc(resource.thumbnailUrl);
      return undefined;
    }
    if (!resource.hasThumbnail) {
      setSrc('');
      return undefined;
    }

    let active = true;
    let objectUrl = '';
    api.get(`/learning-resources/${resource.id}/thumbnail`, { responseType: 'blob' })
      .then((response) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(response.data);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [resource.id, resource.thumbnailUrl, resource.hasThumbnail]);

  if (!src || failed) {
    return (
      <div className={`grid aspect-video place-items-center bg-slate-50 text-muted ${className}`}>
        <Icon aria-hidden="true" className="h-8 w-8" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      className={`aspect-video w-full object-cover ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
