import { DataSource, Repository } from 'typeorm';

export async function relationCheck<T>(
  ids: any,
  repo: Repository<T>,
): Promise<void> {
  if (Array.isArray(ids)) {
    for (const id of ids) {
      const find = await repo.findOne({
        where: {
          id,
        } as any,
      });
      console.log(find);
    }
  } else {
    const find = await repo.findOne({
      where: {
        id: ids,
      } as any,
    });
    console.log(find);
  }
}
