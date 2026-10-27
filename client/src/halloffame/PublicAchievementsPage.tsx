
import { useParams } from 'react-router-dom'
import AchievementsPage from '../achievements/AchievementsPage'

const PublicAchievementsPage = () => {
  const { id } = useParams()
  const userId = Number(id)

  return <AchievementsPage userId={userId} />
}

export default PublicAchievementsPage
