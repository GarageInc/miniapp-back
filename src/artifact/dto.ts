import { type Artifact } from './artifact.schema';

export const toArtifactDto = (artifact: Artifact) => {
  if (!artifact) {
    return null;
  }

  return {
    id: artifact.id,
    logoUrl: artifact.logoUrl,
    backgroundColor: artifact.backgroundColor,
    strokeColor: artifact.strokeColor,
    gifUrl: artifact.gifUrl,
    thumbnailUrl: artifact.thumbnailUrl,
    name: artifact.name,
    description: artifact.description,
    level: artifact.level,
    mintingPrice: artifact.mintingPrice.toString(),
    createdAt: artifact.createdAt,
    updatedAt: artifact.updatedAt,
    _id: artifact._id,
  };
};
