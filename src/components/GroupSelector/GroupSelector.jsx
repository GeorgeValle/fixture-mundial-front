import { GROUP_OPTIONS } from '../../constants/groups'
import styles from './GroupSelector.module.css'

function GroupSelector({ value, onChange }) {
  return (
    <label className={styles.field} htmlFor="group-fixtures-selector">
      <span className={styles.label}>Seleccioná un grupo</span>
      <select
        className={styles.select}
        id="group-fixtures-selector"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {GROUP_OPTIONS.map((group) => (
          <option key={group.value} value={group.value}>
            {group.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export default GroupSelector
