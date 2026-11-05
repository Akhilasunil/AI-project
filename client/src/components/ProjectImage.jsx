import { useEffect, useState } from 'react';
import { FolderKanban } from 'lucide-react';
import api from '../services/api.js';

export default function ProjectImage({ project, className = '' }) {
  const [src, setSrc] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!project?.id || !project.hasImage) {
      setSrc('');
      setFailed(false);
      return undefined;
    }

    let active = true;
    let objectUrl = '';
    setFailed(false);
    api.get(`/projects/${project.id}/image`, {
      responseType: 'blob',
      params: { v: project.updatedAt || '' },
    })
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
  }, [project?.id, project?.hasImage, project?.updatedAt]);

  if (!src || failed) {
    return (
      <div className={`grid aspect-video place-items-center bg-slate-50 text-muted ${className}`}>
        <FolderKanban aria-hidden="true" className="h-8 w-8" />
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
