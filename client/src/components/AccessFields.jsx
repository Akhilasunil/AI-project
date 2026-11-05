import Input from './ui/Input.jsx';
import Select from './ui/Select.jsx';

export default function AccessFields({ idPrefix = '', scope, team, emails, onScope, onTeam, onEmails }) {
  return (
    <>
      <Select id={`${idPrefix}accessScope`} label="Who can access this" value={scope} onChange={(event) => onScope(event.target.value)}>
        <option value="all">All employees</option>
        <option value="team">A specific team</option>
        <option value="restricted">Specific people</option>
      </Select>
      {scope === 'team' ? (
        <Input id={`${idPrefix}team`} label="Team" required value={team} onChange={(event) => onTeam(event.target.value)} />
      ) : null}
      {scope === 'restricted' ? (
        <Input
          id={`${idPrefix}emails`}
          label="Employee emails"
          required
          value={emails}
          hint="Separate email addresses with commas."
          onChange={(event) => onEmails(event.target.value)}
        />
      ) : null}
    </>
  );
}
