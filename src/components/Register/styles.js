import styled from "styled-components";
import { ListGroup, Button, Form, Container } from "react-bootstrap";

export const StyledContainer = styled(Container)`
  background-color: #282828;
  color: #ffffff;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
`;

export const StyledTitle = styled.h2`
  margin-bottom: 30px;
  text-align: center;
`;

export const StyledListGroup = styled(ListGroup)`
  background-color: #3e3e3e;
`;

export const StyledListGroupItem = styled(ListGroup.Item)`
  background-color: #3e3e3e;
  color: ${(props) => (props.isRegistered ? "#888" : "#ffffff")};
  border-color: #555;
  cursor: ${(props) => (props.isRegistered ? "not-allowed" : "pointer")};
  pointer-events: ${(props) => (props.isRegistered ? "none" : "auto")};
  &:hover {
    background-color: ${(props) =>
      props.isRegistered ? "#3e3e3e" : "#4e4e4e"};
  }
`;

export const DoiListItem = styled(ListGroup.Item)`
  background-color: #2d2d2d !important;
  color: #ffffff;
  border-color: #555;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  text-align: center;
  font-style: italic;
  &:hover {
    background-color: #3d3d3d !important;
  }
`;

export const StyledButton = styled(Button)`
  margin-right: 10px;
  background-color: #007bff;
  border: none;
  &:hover {
    background-color: #0056b3;
  }
`;

export const CheckMark = styled.span`
  color: #28a745;
  margin-left: 10px;
`;

export const DoneButton = styled(StyledButton)`
  margin-top: 20px;
`;

export const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
`;

export const RightAlignedButton = styled(StyledButton)`
  margin-left: auto;
`;

export const DoiContainer = styled.div`
  margin-bottom: 20px;
`;

export const DoiInput = styled(Form.Control)`
  background-color: #3e3e3e;
  color: #ffffff;
  border-color: #555;
  &:focus {
    background-color: #4e4e4e;
    color: #ffffff;
    border-color: #007bff;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  }
`;
